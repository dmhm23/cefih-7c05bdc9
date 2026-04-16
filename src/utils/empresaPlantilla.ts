import * as XLSX from 'xlsx';
import { SECTORES_ECONOMICOS, ARL_OPTIONS } from '@/data/formOptions';

const HEADERS = [
  'Nombre Empresa',
  'NIT',
  'Representante Legal',
  'Sector Económico',
  'ARL',
  'Dirección',
  'Ciudad',
  'Departamento',
  'Teléfono Empresa',
  'Persona Contacto',
  'Email Contacto',
  'Observaciones',
];

const EXAMPLE_ROW = [
  'Construcciones ABC S.A.S.',
  '900123456-1',
  'Juan Pérez',
  'Construcción',
  'ARL Sura',
  'Cra 10 #20-30',
  'Bogotá',
  'Cundinamarca',
  '3001234567',
  'María López',
  'contacto@abc.com',
  '',
];

const sectorLabels = SECTORES_ECONOMICOS.map(s => s.label);
const arlLabels = ARL_OPTIONS.map(a => a.label);

export function descargarPlantillaEmpresas() {
  const wb = XLSX.utils.book_new();
  const wsData = [HEADERS, EXAMPLE_ROW];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = HEADERS.map(h => ({ wch: Math.max(h.length + 4, 18) }));

  // Data validation for Sector Económico (col D) and ARL (col E)
  ws['!dataValidation'] = [
    { sqref: 'D2:D9999', type: 'list', formula1: `"${sectorLabels.join(',')}"`, showDropDown: true },
    { sqref: 'E2:E9999', type: 'list', formula1: `"${arlLabels.join(',')}"`, showDropDown: true },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Empresas');
  XLSX.writeFile(wb, 'Plantilla_Importar_Empresas.xlsx');
}

export interface EmpresaImportRow {
  rowIndex: number;
  nombreEmpresa: string;
  nit: string;
  representanteLegal: string;
  sectorEconomico: string;
  arl: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  telefonoEmpresa: string;
  personaContacto: string;
  emailContacto: string;
  observaciones: string;
  errors: string[];
}

function findEnumValue(label: string, options: readonly { value: string; label: string }[]): string | null {
  if (!label) return null;
  const normalized = label.trim().toLowerCase();
  const match = options.find(o => o.label.toLowerCase() === normalized || o.value.toLowerCase() === normalized);
  return match ? match.value : null;
}

export function parsearArchivoEmpresas(file: File): Promise<EmpresaImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length < 2) {
          resolve([]);
          return;
        }

        // Skip header row
        const dataRows = rows.slice(1).filter(r => r.some(cell => cell != null && String(cell).trim() !== ''));
        const nitsInFile = new Map<string, number>();
        const result: EmpresaImportRow[] = dataRows.map((row, idx) => {
          const errors: string[] = [];
          const nombreEmpresa = String(row[0] || '').trim();
          const nit = String(row[1] || '').trim();
          const sectorLabel = String(row[3] || '').trim();
          const arlLabel = String(row[4] || '').trim();

          if (!nombreEmpresa) errors.push('Nombre Empresa es obligatorio');
          if (!nit) errors.push('NIT es obligatorio');

          // Check duplicates within file
          if (nit) {
            if (nitsInFile.has(nit)) {
              errors.push(`NIT duplicado en fila ${nitsInFile.get(nit)! + 2}`);
            } else {
              nitsInFile.set(nit, idx);
            }
          }

          const sectorValue = sectorLabel ? findEnumValue(sectorLabel, SECTORES_ECONOMICOS) : null;
          if (sectorLabel && !sectorValue) errors.push(`Sector "${sectorLabel}" no reconocido`);

          const arlValue = arlLabel ? findEnumValue(arlLabel, ARL_OPTIONS) : null;
          if (arlLabel && !arlValue) errors.push(`ARL "${arlLabel}" no reconocida`);

          return {
            rowIndex: idx + 2,
            nombreEmpresa,
            nit,
            representanteLegal: String(row[2] || '').trim(),
            sectorEconomico: sectorValue || '',
            arl: arlValue || '',
            direccion: String(row[5] || '').trim(),
            ciudad: String(row[6] || '').trim(),
            departamento: String(row[7] || '').trim(),
            telefonoEmpresa: String(row[8] || '').trim(),
            personaContacto: String(row[9] || '').trim(),
            emailContacto: String(row[10] || '').trim(),
            observaciones: String(row[11] || '').trim(),
            errors,
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
