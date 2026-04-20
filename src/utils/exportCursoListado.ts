import { Curso } from "@/types/curso";
import { Matricula } from "@/types/matricula";
import { Persona } from "@/types/persona";
import {
  TIPOS_DOCUMENTO,
  GENEROS,
  NIVELES_EDUCATIVOS,
  PAISES,
  AREAS_TRABAJO,
  SECTORES_ECONOMICOS,
  ARL_OPTIONS,
  EPS_OPTIONS,
} from "@/data/formOptions";
import { capitalize, findLabel, cleanDocumento, formatDate } from "@/utils/csvMinTrabajo";

/**
 * Extras que se pasan a los resolvers de cada columna.
 * Permite inyectar datos calculados externamente (ej. códigos de estudiante)
 * sin acoplar el catálogo a hooks de React.
 */
export interface ResolverExtras {
  codigosEstudiante?: Record<string, string>;
}

export interface ColumnDef {
  key: string;
  header: string;
  group: string;
  defaultSelected: boolean;
  resolver: (
    persona: Persona,
    matricula: Matricula,
    curso: Curso,
    resolveNivel: (id?: string | null) => string,
    extras?: ResolverExtras
  ) => string;
}

/**
 * Catálogo único de columnas exportables. Único origen de verdad
 * tanto para el modal de exportación masiva como para la descarga
 * individual por estudiante.
 */
export const COLUMN_CATALOG: ColumnDef[] = [
  // Persona
  { key: "p_nombre_completo", header: "Nombre Completo", group: "Persona", defaultSelected: false,
    resolver: (p) => capitalize(`${p.nombres} ${p.apellidos}`) },
  { key: "p_tipo_doc", header: "Tipo Documento", group: "Persona", defaultSelected: false,
    resolver: (p) => findLabel([...TIPOS_DOCUMENTO], p.tipoDocumento) },
  { key: "p_numero_doc", header: "Número Documento", group: "Persona", defaultSelected: false,
    resolver: (p) => cleanDocumento(p.numeroDocumento) },
  { key: "p_nombres", header: "Nombres", group: "Persona", defaultSelected: false,
    resolver: (p) => capitalize(p.nombres) },
  { key: "p_apellidos", header: "Apellidos", group: "Persona", defaultSelected: false,
    resolver: (p) => capitalize(p.apellidos) },
  { key: "p_genero", header: "Género", group: "Persona", defaultSelected: false,
    resolver: (p) => findLabel([...GENEROS], p.genero) },
  { key: "p_fecha_nac", header: "Fecha Nacimiento", group: "Persona", defaultSelected: false,
    resolver: (p) => formatDate(p.fechaNacimiento) },
  { key: "p_pais", header: "País Nacimiento", group: "Persona", defaultSelected: false,
    resolver: (p) => findLabel([...PAISES], p.paisNacimiento) },
  { key: "p_rh", header: "RH", group: "Persona", defaultSelected: false,
    resolver: (p) => p.rh || "" },
  { key: "p_nivel_edu", header: "Nivel Educativo", group: "Persona", defaultSelected: false,
    resolver: (p) => findLabel([...NIVELES_EDUCATIVOS], p.nivelEducativo) },
  { key: "p_email", header: "Email", group: "Persona", defaultSelected: false,
    resolver: (p) => p.email || "" },
  { key: "p_telefono", header: "Teléfono", group: "Persona", defaultSelected: false,
    resolver: (p) => p.telefono || "" },
  { key: "p_emergencia_nombre", header: "Contacto Emergencia - Nombre", group: "Persona", defaultSelected: false,
    resolver: (p) => (p.contactoEmergencia as any)?.nombre || "" },
  { key: "p_emergencia_tel", header: "Contacto Emergencia - Teléfono", group: "Persona", defaultSelected: false,
    resolver: (p) => (p.contactoEmergencia as any)?.telefono || "" },
  { key: "p_emergencia_parentesco", header: "Contacto Emergencia - Parentesco", group: "Persona", defaultSelected: false,
    resolver: (p) => (p.contactoEmergencia as any)?.parentesco || "" },

  // Matrícula
  { key: "m_estado", header: "Estado Matrícula", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => capitalize(m.estado) },
  { key: "m_tipo_vinculacion", header: "Tipo Vinculación", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => capitalize(m.tipoVinculacion || "") },
  { key: "m_empresa", header: "Nombre Empresa", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => capitalize(m.empresaNombre || "Independiente") },
  { key: "m_representante", header: "Representante Legal", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => capitalize(m.empresaRepresentanteLegal || "") },
  { key: "m_nit", header: "NIT", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => m.empresaNit || "" },
  { key: "m_cargo", header: "Cargo", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => capitalize(m.empresaCargo || "") },
  { key: "m_arl", header: "ARL", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => findLabel([...ARL_OPTIONS], m.arl) },
  { key: "m_eps", header: "EPS", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => findLabel([...EPS_OPTIONS], m.eps) },
  { key: "m_sector", header: "Sector Económico", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => findLabel([...SECTORES_ECONOMICOS], m.sectorEconomico) },
  { key: "m_area", header: "Área de Trabajo", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => findLabel([...AREAS_TRABAJO], m.areaTrabajo) },
  { key: "m_valor_cupo", header: "Valor Cupo", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => String(m.valorCupo ?? 0) },
  { key: "m_abono", header: "Abono", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => String(m.abono ?? 0) },
  { key: "m_pagado", header: "Pagado", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => m.pagado ? "Sí" : "No" },
  { key: "m_fecha_inicio", header: "Fecha Inicio Matrícula", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => formatDate(m.fechaInicio) },
  { key: "m_fecha_fin", header: "Fecha Fin Matrícula", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => formatDate(m.fechaFin) },
  { key: "m_cobro_nombre", header: "Contacto Cobro - Nombre", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => capitalize(m.cobroContactoNombre || "") },
  { key: "m_cobro_cel", header: "Contacto Cobro - Celular", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => m.cobroContactoCelular || "" },

  // Curso
  { key: "c_nivel", header: "Nivel de Formación", group: "Curso", defaultSelected: false,
    resolver: (_p, _m, c, resolveNivel) => resolveNivel(c.nivelFormacionId || c.tipoFormacion) },
  { key: "c_tipo", header: "Tipo Formación", group: "Curso", defaultSelected: false,
    resolver: (_p, _m, c) => capitalize(c.tipoFormacion) },
  { key: "c_numero", header: "Número Curso", group: "Curso", defaultSelected: false,
    resolver: (_p, _m, c) => c.numeroCurso || "" },
  { key: "c_horas", header: "Duración", group: "Curso", defaultSelected: false,
    resolver: (_p, _m, c) => `${c.horasTotales ?? 0} h` },
  { key: "c_dias", header: "Duración Días", group: "Curso", defaultSelected: false,
    resolver: (_p, _m, c) => String(c.duracionDias ?? 0) },
  { key: "c_fecha_inicio", header: "Fecha Inicio Curso", group: "Curso", defaultSelected: false,
    resolver: (_p, _m, c) => formatDate(c.fechaInicio) },
  { key: "c_fecha_fin", header: "Fecha Fin Curso", group: "Curso", defaultSelected: false,
    resolver: (_p, _m, c) => formatDate(c.fechaFin) },
  { key: "c_entrenador", header: "Entrenador", group: "Curso", defaultSelected: false,
    resolver: (_p, _m, c) => c.entrenadorNombre || "" },
  { key: "c_supervisor", header: "Supervisor", group: "Curso", defaultSelected: false,
    resolver: (_p, _m, c) => c.supervisorNombre || "" },
  { key: "c_lugar", header: "Lugar", group: "Curso", defaultSelected: false,
    resolver: (_p, _m, c) => (c as any).lugar || "" },

  // Estudiante (datos derivados de curso + matrícula)
  { key: "m_codigo_estudiante", header: "Código del Estudiante", group: "Estudiante", defaultSelected: false,
    resolver: (_p, m, _c, _rn, extras) => extras?.codigosEstudiante?.[m.id] ?? "" },
];

/**
 * Plantilla oficial fija: orden estricto de columnas para exportación.
 * Cualquier exportación reordena las columnas seleccionadas siguiendo
 * primero este orden y luego el resto del catálogo.
 */
export const PLANTILLA_OFICIAL_KEYS: string[] = [
  "m_empresa",
  "m_representante",
  "m_nit",
  "p_tipo_doc",
  "p_numero_doc",
  "p_nombre_completo",
  "m_arl",
  "c_nivel",
  "c_horas",
  "m_codigo_estudiante",
];

export const GROUPS = ["Persona", "Matrícula", "Curso", "Estudiante"];

/**
 * Reordena las columnas seleccionadas: primero las que están en la
 * plantilla oficial (en su orden estricto), luego las demás en el
 * orden original del catálogo.
 */
export function ordenarColumnas(seleccionadas: ColumnDef[]): ColumnDef[] {
  const oficial = PLANTILLA_OFICIAL_KEYS
    .map((k) => seleccionadas.find((c) => c.key === k))
    .filter((c): c is ColumnDef => !!c);
  const extra = seleccionadas.filter((c) => !PLANTILLA_OFICIAL_KEYS.includes(c.key));
  return [...oficial, ...extra];
}

function escapeCsv(val: string): string {
  // Mantener separador ';' como el resto del sistema; reemplazar saltos de línea
  return (val ?? "").replace(/[\r\n]+/g, " ").replace(/;/g, ",");
}

export interface BuildCsvParams {
  matriculas: Matricula[];
  personaMap: Map<string, Persona>;
  curso: Curso;
  resolveNivel: (id?: string | null) => string;
  codigosEstudiante: Record<string, string>;
  columnasSeleccionadas: ColumnDef[];
}

export interface BuildCsvResult {
  content: string;
  filas: number;
  columnas: ColumnDef[];
}

/**
 * Construye el contenido CSV reutilizable para exportación masiva
 * o individual de estudiantes de un curso.
 */
export function buildCursoListadoCsv({
  matriculas,
  personaMap,
  curso,
  resolveNivel,
  codigosEstudiante,
  columnasSeleccionadas,
}: BuildCsvParams): BuildCsvResult {
  const cols = ordenarColumnas(columnasSeleccionadas);
  const extras: ResolverExtras = { codigosEstudiante };

  const header = cols.map((c) => escapeCsv(c.header)).join(";");
  const rows = matriculas
    .map((m) => {
      const persona = personaMap.get(m.personaId);
      if (!persona) return null;
      return cols
        .map((c) => escapeCsv(c.resolver(persona, m, curso, resolveNivel, extras)))
        .join(";");
    })
    .filter((r): r is string => r !== null);

  return {
    content: [header, ...rows].join("\n"),
    filas: rows.length,
    columnas: cols,
  };
}
