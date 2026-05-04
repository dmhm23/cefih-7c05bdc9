import { Matricula } from "@/types/matricula";
import { Persona } from "@/types/persona";
import { Curso } from "@/types/curso";
import { Empresa } from "@/types/empresa";
import {
  PAISES,
  NIVELES_EDUCATIVOS,
  AREAS_TRABAJO,
  SECTORES_ECONOMICOS,
  ARL_OPTIONS,
} from "@/data/formOptions";

// Salvaguardas defensivas: si llegara un valor en formato enum DB, mapear al código MinTrabajo.
const TIPO_DOC_DB_TO_MINTRABAJO: Record<string, string> = {
  cedula_ciudadania: "CC",
  cedula_extranjeria: "CE",
  pasaporte: "PA",
  permiso_especial: "PE",
  permiso_proteccion: "PP",
};
const GENERO_DB_TO_MINTRABAJO: Record<string, string> = {
  masculino: "M",
  femenino: "F",
  otro: "O",
};

function mapTipoDocumento(value: string | undefined): string {
  if (!value) return "";
  return TIPO_DOC_DB_TO_MINTRABAJO[value] ?? value.toUpperCase();
}

function mapGenero(value: string | undefined): string {
  if (!value) return "";
  return GENERO_DB_TO_MINTRABAJO[value] ?? value.toUpperCase();
}

/**
 * Convert to Title Case preserving tildes, ñ and special characters.
 */
export function capitalize(value: string): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

export function findLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | undefined
): string {
  if (!value) return "";
  const found = options.find((o) => o.value === value);
  return found ? capitalize(found.label) : capitalize(value);
}
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch {
    return "";
  }
}

function splitName(fullName: string, index: number): string {
  const parts = fullName.trim().split(/\s+/);
  return capitalize(parts[index] ?? "");
}

export function cleanDocumento(doc: string): string {
  return doc.replace(/[\.\s]/g, "");
}

function buildRow(persona: Persona, matricula: Matricula, empresa?: Empresa): string {
  // Fallback solo si: tipo_vinculacion='empresa', existe empresa_id, matrícula vacía y empresa con valor.
  const aplicaFallback =
    matricula.tipoVinculacion === "empresa" && !!matricula.empresaId && !!empresa;

  const arlEfectiva =
    matricula.arl && matricula.arl.trim()
      ? matricula.arl
      : aplicaFallback && empresa?.arl
      ? empresa.arl
      : "";
  const sectorEfectivo =
    matricula.sectorEconomico && matricula.sectorEconomico.trim()
      ? matricula.sectorEconomico
      : aplicaFallback && empresa?.sectorEconomico
      ? empresa.sectorEconomico
      : "";
  const empresaNombreEfectivo =
    matricula.empresaNombre && matricula.empresaNombre.trim()
      ? matricula.empresaNombre
      : aplicaFallback && empresa?.nombreEmpresa
      ? empresa.nombreEmpresa
      : "Independiente";

  const columns = [
    mapTipoDocumento(persona.tipoDocumento),
    cleanDocumento(persona.numeroDocumento),
    splitName(persona.nombres, 0),
    splitName(persona.nombres, 1),
    splitName(persona.apellidos, 0),
    splitName(persona.apellidos, 1),
    mapGenero(persona.genero),
    findLabel(PAISES, persona.paisNacimiento),
    formatDate(persona.fechaNacimiento),
    findLabel(NIVELES_EDUCATIVOS, persona.nivelEducativo),
    findLabel(AREAS_TRABAJO, matricula.areaTrabajo),
    capitalize(matricula.empresaCargo ?? ""),
    findLabel(SECTORES_ECONOMICOS, sectorEfectivo),
    capitalize(empresaNombreEfectivo),
    findLabel(ARL_OPTIONS, arlEfectiva),
  ];
  return columns.join(";");
}

export interface MinTrabajoValidationWarning {
  personaId: string;
  nombre: string;
  faltaArl: boolean;
  faltaSector: boolean;
}

/**
 * Valida estudiantes con ARL/sector vacío después de aplicar el fallback.
 */
export function validateMinTrabajoData(
  matriculas: Matricula[],
  personas: Persona[],
  empresas: Empresa[] = []
): MinTrabajoValidationWarning[] {
  const personaMap = new Map(personas.map((p) => [p.id, p]));
  const empresaMap = new Map(empresas.map((e) => [e.id, e]));
  const warnings: MinTrabajoValidationWarning[] = [];
  for (const m of matriculas) {
    const persona = personaMap.get(m.personaId);
    if (!persona) continue;
    const empresa = m.empresaId ? empresaMap.get(m.empresaId) : undefined;
    const aplicaFallback = m.tipoVinculacion === "empresa" && !!empresa;
    const arl = m.arl?.trim() || (aplicaFallback ? empresa?.arl : "") || "";
    const sector = m.sectorEconomico?.trim() || (aplicaFallback ? empresa?.sectorEconomico : "") || "";
    if (!arl || !sector) {
      warnings.push({
        personaId: persona.id,
        nombre: `${persona.nombres} ${persona.apellidos}`.trim(),
        faltaArl: !arl,
        faltaSector: !sector,
      });
    }
  }
  return warnings;
}

/**
 * Generate a real CSV from course enrollments + personas.
 */
export function generateMinTrabajoCsv(
  matriculas: Matricula[],
  personas: Persona[],
  _curso: Curso,
  empresas: Empresa[] = []
): string {
  const personaMap = new Map(personas.map((p) => [p.id, p]));
  const empresaMap = new Map(empresas.map((e) => [e.id, e]));

  const rows = matriculas
    .map((m) => {
      const persona = personaMap.get(m.personaId);
      if (!persona) return null;
      const empresa = m.empresaId ? empresaMap.get(m.empresaId) : undefined;
      return buildRow(persona, m, empresa);
    })
    .filter(Boolean);

  return rows.join("\n");
}

/**
 * Generate a dummy CSV with 3 example rows for testing.
 */
export function generateDummyCsv(): string {
  const dummyRows = [
    "CC;1234567890;Juan;Carlos;Rodriguez;Perez;M;Colombia;06/15/1985;Universitario;Operativa;Operario De Alturas;Construcción;Constructora Abc S.A.S;",
    "CC;0987654321;Ana;Maria;Garcia;Lopez;F;Colombia;03/22/1990;Tecnólogo;Administrativo;;Energía Eléctrica;Independiente;",
    "CC;5678901234;Pedro;Antonio;Martinez;Ruiz;M;Colombia;11/08/1988;Bachiller;Operativa;Supervisor De Obra;Infraestructura Vial Y Transporte;Infraestructuras Del Norte S.A.;",
  ];
  return dummyRows.join("\n");
}

/**
 * Generate a CSV with headers for the student list export.
 */
export function generateListadoEstudiantesCsv(
  matriculas: Matricula[],
  personas: Persona[],
  curso: Curso
): string {
  const personaMap = new Map(personas.map((p) => [p.id, p]));

  const header = [
    "Tipo Doc",
    "Número Documento",
    "Nombres",
    "Apellidos",
    "Género",
    "Email",
    "Teléfono",
    "Empresa",
    "Cargo",
    "Estado Matrícula",
    "ARL",
    "EPS",
  ].join(";");

  const rows = matriculas
    .map((m) => {
      const persona = personaMap.get(m.personaId);
      if (!persona) return null;
      const cols = [
        persona.tipoDocumento,
        cleanDocumento(persona.numeroDocumento),
        capitalize(persona.nombres),
        capitalize(persona.apellidos),
        persona.genero,
        persona.email || "",
        persona.telefono || "",
        capitalize(m.empresaNombre || "Independiente"),
        capitalize(m.empresaCargo ?? ""),
        m.estado,
        m.arl || "",
        m.eps || "",
      ];
      return cols.join(";");
    })
    .filter(Boolean);

  return [header, ...rows].join("\n");
}

/**
 * Trigger a browser download of a CSV string.
 *
 * Garantiza UTF-8 con BOM (`\uFEFF`) para que Excel y otras hojas de cálculo
 * interpreten correctamente caracteres con tildes y eñes (Construcción, José,
 * Peña, etc.). Si el contenido ya trae BOM, no lo duplica.
 */
export function downloadCsv(content: string, filename: string): void {
  const BOM = "\uFEFF";
  const body = content.startsWith(BOM) ? content : BOM + content;
  const blob = new Blob([body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

