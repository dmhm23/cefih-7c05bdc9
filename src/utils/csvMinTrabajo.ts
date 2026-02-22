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
 * Convert to Title Case preserving tildes, ñ and special characters.
 */
function capitalize(value: string): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function findLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | undefined
): string {
  if (!value) return "";
  const found = options.find((o) => o.value === value);
  return found ? capitalize(found.label) : capitalize(value);
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
  return capitalize(parts[index] ?? "");
}

function cleanDocumento(doc: string): string {
  return doc.replace(/[\.\s]/g, "");
}

function buildRow(persona: Persona, matricula: Matricula): string {
  const columns = [
    persona.tipoDocumento,
    cleanDocumento(persona.numeroDocumento),
    splitName(persona.nombres, 0),
    splitName(persona.nombres, 1),
    splitName(persona.apellidos, 0),
    splitName(persona.apellidos, 1),
    persona.genero,
    findLabel(PAISES, persona.paisNacimiento),
    formatDate(persona.fechaNacimiento),
    findLabel(NIVELES_EDUCATIVOS, persona.nivelEducativo),
    findLabel(AREAS_TRABAJO, matricula.areaTrabajo),
    capitalize(matricula.empresaCargo ?? ""),
    findLabel(SECTORES_ECONOMICOS, matricula.sectorEconomico),
    capitalize(matricula.empresaNombre || "Independiente"),
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
    "CC;1234567890;Juan;Carlos;Rodriguez;Perez;M;Colombia;06/15/1985;Universitario;Operativa;Operario De Alturas;Construcción;Constructora Abc S.A.S;",
    "CC;0987654321;Ana;Maria;Garcia;Lopez;F;Colombia;03/22/1990;Tecnólogo;Administrativo;;Energía Eléctrica;Independiente;",
    "CC;5678901234;Pedro;Antonio;Martinez;Ruiz;M;Colombia;11/08/1988;Bachiller;Operativa;Supervisor De Obra;Infraestructura Vial Y Transporte;Infraestructuras Del Norte S.A.;",
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
