import * as XLSX from 'xlsx';
import { TIPOS_DOCUMENTO, GENEROS, NIVELES_EDUCATIVOS, GRUPOS_SANGUINEOS } from '@/data/formOptions';

const HEADERS = [
  'Tipo Documento',
  'Número Documento',
  'Nombres',
  'Apellidos',
  'Género',
  'Fecha Nacimiento',
  'País Nacimiento',
  'RH',
  'Nivel Educativo',
  'Email',
  'Teléfono',
  'Contacto Emergencia Nombre',
  'Contacto Emergencia Teléfono',
  'Contacto Emergencia Parentesco',
];

const EXAMPLE_ROW = [
  'CC',
  '1234567890',
  'Juan Carlos',
  'Pérez Gómez',
  'Masculino',
  '1990-05-15',
  'Colombia',
  'O+',
  'Técnico',
  'juan@email.com',
  '3001234567',
  'María Pérez',
  '3009876543',
  'Madre',
];

const tipoDocLabels = TIPOS_DOCUMENTO.map(t => t.value);
const generoLabels = GENEROS.map(g => g.label);
const rhLabels = GRUPOS_SANGUINEOS.map(r => r.value);
const nivelLabels = NIVELES_EDUCATIVOS.map(n => n.label);

export function descargarPlantillaPersonas() {
  const wb = XLSX.utils.book_new();
  const wsData = [HEADERS, EXAMPLE_ROW];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = HEADERS.map(h => ({ wch: Math.max(h.length + 4, 18) }));

  ws['!dataValidation'] = [
    { sqref: 'A2:A9999', type: 'list', formula1: `"${tipoDocLabels.join(',')}"`, showDropDown: true },
    { sqref: 'E2:E9999', type: 'list', formula1: `"${generoLabels.join(',')}"`, showDropDown: true },
    { sqref: 'H2:H9999', type: 'list', formula1: `"${rhLabels.join(',')}"`, showDropDown: true },
    { sqref: 'I2:I9999', type: 'list', formula1: `"${nivelLabels.join(',')}"`, showDropDown: true },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Personas');
  XLSX.writeFile(wb, 'Plantilla_Importar_Personas.xlsx');
}

export interface PersonaImportRow {
  rowIndex: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  genero: string;
  fechaNacimiento: string;
  paisNacimiento: string;
  rh: string;
  nivelEducativo: string;
  email: string;
  telefono: string;
  contactoEmergenciaNombre: string;
  contactoEmergenciaTelefono: string;
  contactoEmergenciaParentesco: string;
  errors: string[];
  warnings: string[];
  duplicadoEnArchivo?: boolean;
  duplicadoFilaOriginal?: number;
  existeEnBD?: boolean;
}

const TIPO_DOC_MAP: Record<string, string> = {
  CC: 'CC', CE: 'CE', PA: 'PA', PE: 'PE', PP: 'PP',
};

const GENERO_LABEL_TO_VALUE: Record<string, string> = {
  masculino: 'M', femenino: 'F', otro: 'O',
  m: 'M', f: 'F', o: 'O',
};

function findEnumValue(label: string, options: readonly { value: string; label: string }[]): string | null {
  if (!label) return null;
  const normalized = label.trim().toLowerCase();
  const match = options.find(o => o.label.toLowerCase() === normalized || o.value.toLowerCase() === normalized);
  return match ? match.value : null;
}

function parseDate(raw: any): string {
  if (!raw) return '';
  if (typeof raw === 'number') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(raw);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const s = String(raw).trim();
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Try DD/MM/YYYY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return s;
}

export function parsearArchivoPersonas(file: File): Promise<PersonaImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

        if (rows.length < 2) { resolve([]); return; }

        const dataRows = rows.slice(1).filter(r => r.some(cell => cell != null && String(cell).trim() !== ''));
        const docsInFile = new Map<string, number>();

        const result: PersonaImportRow[] = dataRows.map((row, idx) => {
          const errors: string[] = [];
          const tipoDocRaw = String(row[0] || '').trim().toUpperCase();
          const numeroDocumento = String(row[1] || '').trim();
          const nombres = String(row[2] || '').trim();
          const apellidos = String(row[3] || '').trim();
          const generoRaw = String(row[4] || '').trim();
          const fechaRaw = row[5];
          const paisNacimiento = String(row[6] || '').trim();
          const rhRaw = String(row[7] || '').trim();
          const nivelRaw = String(row[8] || '').trim();
          const email = String(row[9] || '').trim();
          const telefono = String(row[10] || '').trim();
          const ceNombre = String(row[11] || '').trim();
          const ceTelefono = String(row[12] || '').trim();
          const ceParentesco = String(row[13] || '').trim();

          // Validations — solo campos NOT NULL sin default en BD son obligatorios
          // Tipo documento: si viene vacío, default 'CC'. Si viene con valor inválido, error.
          let tipoDocumento = TIPO_DOC_MAP[tipoDocRaw] || '';
          if (!tipoDocRaw) {
            tipoDocumento = 'CC';
          } else if (!tipoDocumento) {
            errors.push(`Tipo Documento "${tipoDocRaw}" no reconocido`);
          }

          if (!numeroDocumento) errors.push('Número Documento es obligatorio');
          if (!nombres) errors.push('Nombres es obligatorio');
          if (!apellidos) errors.push('Apellidos es obligatorio');

          // Duplicate check — moved to warnings
          const warnings: string[] = [];
          let duplicadoEnArchivo = false;
          let duplicadoFilaOriginal: number | undefined;
          if (numeroDocumento) {
            if (docsInFile.has(numeroDocumento)) {
              duplicadoEnArchivo = true;
              duplicadoFilaOriginal = docsInFile.get(numeroDocumento)! + 2;
              warnings.push(`Documento duplicado en archivo (fila ${duplicadoFilaOriginal})`);
            } else {
              docsInFile.set(numeroDocumento, idx);
            }
          }

          // Género
          let genero = '';
          if (generoRaw) {
            genero = GENERO_LABEL_TO_VALUE[generoRaw.toLowerCase()] || '';
            if (!genero) errors.push(`Género "${generoRaw}" no reconocido`);
          }

          // Fecha
          const fechaNacimiento = parseDate(fechaRaw);
          if (fechaRaw && fechaNacimiento && !/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) {
            errors.push(`Fecha Nacimiento "${fechaRaw}" no es válida`);
          }

          // RH
          let rh = '';
          if (rhRaw) {
            rh = findEnumValue(rhRaw, GRUPOS_SANGUINEOS) || '';
            if (!rh) errors.push(`RH "${rhRaw}" no reconocido`);
          }

          // Nivel educativo
          let nivelEducativo = '';
          if (nivelRaw) {
            nivelEducativo = findEnumValue(nivelRaw, NIVELES_EDUCATIVOS) || '';
            if (!nivelEducativo) errors.push(`Nivel Educativo "${nivelRaw}" no reconocido`);
          }

          return {
            rowIndex: idx + 2,
            tipoDocumento: tipoDocumento || tipoDocRaw,
            numeroDocumento,
            nombres,
            apellidos,
            genero,
            fechaNacimiento: /^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento) ? fechaNacimiento : '',
            paisNacimiento,
            rh,
            nivelEducativo,
            email,
            telefono,
            contactoEmergenciaNombre: ceNombre,
            contactoEmergenciaTelefono: ceTelefono,
            contactoEmergenciaParentesco: ceParentesco,
            errors,
            warnings,
            duplicadoEnArchivo,
            duplicadoFilaOriginal,
          };
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
