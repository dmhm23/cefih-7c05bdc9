import { Matricula } from "@/types/matricula";
import { Persona } from "@/types/persona";
import { Curso } from "@/types/curso";
import {
  PAISES,
  NIVELES_EDUCATIVOS,
  AREAS_TRABAJO,
  SECTORES_ECONOMICOS,
  ARL_OPTIONS,
} from "@/data/formOptions";

/**
 * Remove diacritics (tildes) from a string and convert to uppercase.
 */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function findLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | undefined
): string {
  if (!value) return "";
  const found = options.find((o) => o.value === value);
  return found ? normalize(found.label) : normalize(value);
}

function formatDate(dateStr: string | undefined): string {
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
  return normalize(parts[index] ?? "");
}

function cleanDocumento(doc: string): string {
  return doc.replace(/[\.\s]/g, "");
}

function buildRow(persona: Persona, matricula: Matricula): string {
  const columns = [
    normalize(persona.tipoDocumento),
    cleanDocumento(persona.numeroDocumento),
    splitName(persona.nombres, 0),
    splitName(persona.nombres, 1),
    splitName(persona.apellidos, 0),
    splitName(persona.apellidos, 1),
    normalize(persona.genero),
    findLabel(PAISES, persona.paisNacimiento),
    formatDate(persona.fechaNacimiento),
    findLabel(NIVELES_EDUCATIVOS, persona.nivelEducativo),
    findLabel(AREAS_TRABAJO, persona.areaTrabajo),
    normalize(matricula.empresaCargo ?? ""),
    findLabel(SECTORES_ECONOMICOS, matricula.sectorEconomico),
    normalize(matricula.empresaNombre || "INDEPENDIENTE"),
    findLabel(ARL_OPTIONS, matricula.arl),
  ];
  return columns.join(";");
}

/**
 * Generate a real CSV from course enrollments + personas.
 */
export function generateMinTrabajoCsv(
  matriculas: Matricula[],
  personas: Persona[],
  _curso: Curso
): string {
  const personaMap = new Map(personas.map((p) => [p.id, p]));

  const rows = matriculas
    .map((m) => {
      const persona = personaMap.get(m.personaId);
      if (!persona) return null;
      return buildRow(persona, m);
    })
    .filter(Boolean);

  return rows.join("\n");
}

/**
 * Generate a dummy CSV with 3 example rows for testing.
 */
export function generateDummyCsv(): string {
  const dummyRows = [
    "CC;1023456789;JUAN;CARLOS;MARTINEZ;LOPEZ;M;COLOMBIA;03/15/1990;BACHILLER;OPERATIVA;ELECTRICISTA;CONSTRUCCION;CONSTRUCTORA ABC SAS;ARL SURA",
    "CE;987654321;MARIA;;GONZALEZ;PEREZ;F;VENEZUELA;07/22/1985;TECNICO;ADMINISTRATIVA;ASISTENTE ADMINISTRATIVO;TELECOMUNICACIONES;INDEPENDIENTE;POSITIVA COMPANIA DE SEGUROS S.A.",
    "CC;1122334455;PEDRO;ANDRES;RAMIREZ;;M;COLOMBIA;11/05/1995;UNIVERSITARIO;OPERATIVA;INGENIERO DE CAMPO;ENERGIA ELECTRICA;ENERGIA TOTAL SAS;COLMENA SEGUROS S.A.",
  ];
  return dummyRows.join("\n");
}

/**
 * Trigger a browser download of a CSV string.
 */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
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
