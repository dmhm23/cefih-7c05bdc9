import { Matricula, FORMA_PAGO_LABELS, ESTADO_MATRICULA_LABELS, TIPO_VINCULACION_LABELS, NIVEL_PREVIO_LABELS } from "@/types/matricula";
import { Empresa } from "@/types/empresa";
import { TIPO_FORMACION_LABELS } from "@/types/curso";
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
import { resolveCatalogLabel } from "@/utils/resolveCatalogLabel";

export interface CursoResumenExport {
  id: string;
  numeroCurso: string;
  tipoFormacion: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  duracionDias: number;
  duracionHoras: number;
  entrenadorNombre: string;
}

export interface PersonaResumenExport {
  id: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  genero?: string | null;
  email?: string | null;
  telefono?: string | null;
  fechaNacimiento?: string | null;
  paisNacimiento?: string | null;
  nivelEducativo?: string | null;
  rh?: string | null;
}

export interface ResolverCtx {
  persona: PersonaResumenExport;
  matricula: Matricula;
  empresa?: Empresa;
  curso?: CursoResumenExport;
  resolveNivel: (id?: string | null) => string;
}

export interface MatriculaColumnDef {
  key: string;
  header: string;
  group: string;
  /** Si es true, no se puede desmarcar en la UI */
  mandatory?: boolean;
  /** Si es true, está marcada por defecto al abrir el modal */
  defaultSelected?: boolean;
  resolver: (ctx: ResolverCtx) => string;
}

/** Aplica fallback empresa para ARL/sector/nombreEmpresa según las reglas establecidas */
function arlEfectiva(m: Matricula, e?: Empresa): { val: string; otra?: string } {
  if (m.arl && m.arl.trim()) return { val: m.arl, otra: m.arlOtra };
  if (m.tipoVinculacion === "empresa" && m.empresaId && e?.arl) return { val: e.arl, otra: e.arlOtra };
  return { val: "" };
}
function sectorEfectivo(m: Matricula, e?: Empresa): { val: string; otra?: string } {
  if (m.sectorEconomico && m.sectorEconomico.trim()) return { val: m.sectorEconomico, otra: m.sectorEconomicoOtro };
  if (m.tipoVinculacion === "empresa" && m.empresaId && e?.sectorEconomico) return { val: e.sectorEconomico, otra: e.sectorEconomicoOtro };
  return { val: "" };
}
function empresaNombreEfectivo(m: Matricula, e?: Empresa): string {
  if (m.empresaNombre && m.empresaNombre.trim()) return m.empresaNombre;
  if (m.tipoVinculacion === "empresa" && m.empresaId && e?.nombreEmpresa) return e.nombreEmpresa;
  return m.tipoVinculacion === "independiente" ? "Independiente" : "";
}

export const MATRICULA_COLUMN_CATALOG: MatriculaColumnDef[] = [
  // ===== Persona (mandatorias y básicas) =====
  { key: "p_tipo_doc", header: "Tipo Documento", group: "Persona", mandatory: true, defaultSelected: true,
    resolver: ({ persona }) => findLabel([...TIPOS_DOCUMENTO], persona.tipoDocumento) || persona.tipoDocumento || "" },
  { key: "p_numero_doc", header: "Número Documento", group: "Persona", mandatory: true, defaultSelected: true,
    resolver: ({ persona }) => cleanDocumento(persona.numeroDocumento) },
  { key: "p_nombres", header: "Nombres", group: "Persona", mandatory: true, defaultSelected: true,
    resolver: ({ persona }) => capitalize(persona.nombres) },
  { key: "p_apellidos", header: "Apellidos", group: "Persona", mandatory: true, defaultSelected: true,
    resolver: ({ persona }) => capitalize(persona.apellidos) },
  { key: "p_genero", header: "Género", group: "Persona", defaultSelected: true,
    resolver: ({ persona }) => findLabel([...GENEROS], persona.genero || "") },
  { key: "p_email", header: "Email", group: "Persona", defaultSelected: true,
    resolver: ({ persona }) => persona.email || "" },
  { key: "p_telefono", header: "Teléfono", group: "Persona", defaultSelected: true,
    resolver: ({ persona }) => persona.telefono || "" },
  { key: "p_fecha_nac", header: "Fecha Nacimiento", group: "Persona",
    resolver: ({ persona }) => formatDate(persona.fechaNacimiento || undefined) },
  { key: "p_pais", header: "País Nacimiento", group: "Persona",
    resolver: ({ persona }) => findLabel([...PAISES], persona.paisNacimiento || "") },
  { key: "p_nivel_edu", header: "Nivel Educativo", group: "Persona",
    resolver: ({ persona }) => findLabel([...NIVELES_EDUCATIVOS], persona.nivelEducativo || "") },
  { key: "p_rh", header: "RH", group: "Persona",
    resolver: ({ persona }) => persona.rh || "" },

  // ===== Matrícula / Vinculación laboral =====
  { key: "m_estado", header: "Estado Matrícula", group: "Matrícula", defaultSelected: true,
    resolver: ({ matricula }) => ESTADO_MATRICULA_LABELS[matricula.estado] || matricula.estado },
  { key: "m_tipo_vinculacion", header: "Tipo Vinculación", group: "Matrícula", defaultSelected: true,
    resolver: ({ matricula }) => matricula.tipoVinculacion ? TIPO_VINCULACION_LABELS[matricula.tipoVinculacion] : "" },
  { key: "m_empresa", header: "Empresa", group: "Matrícula", defaultSelected: true,
    resolver: ({ matricula, empresa }) => capitalize(empresaNombreEfectivo(matricula, empresa)) },
  { key: "m_nit", header: "NIT Empresa", group: "Matrícula",
    resolver: ({ matricula, empresa }) => matricula.empresaNit || empresa?.nit || "" },
  { key: "m_representante", header: "Representante Legal", group: "Matrícula",
    resolver: ({ matricula, empresa }) => capitalize(matricula.empresaRepresentanteLegal || empresa?.representanteLegal || "") },
  { key: "m_cargo", header: "Cargo", group: "Matrícula",
    resolver: ({ matricula }) => capitalize(matricula.empresaCargo || "") },
  { key: "m_area", header: "Área de Trabajo", group: "Matrícula",
    resolver: ({ matricula }) => findLabel([...AREAS_TRABAJO], matricula.areaTrabajo || "") },
  { key: "m_sector", header: "Sector Económico", group: "Matrícula", defaultSelected: true,
    resolver: ({ matricula, empresa }) => findLabel([...SECTORES_ECONOMICOS], sectorEfectivo(matricula, empresa)) },
  { key: "m_arl", header: "ARL", group: "Matrícula", defaultSelected: true,
    resolver: ({ matricula, empresa }) => findLabel([...ARL_OPTIONS], arlEfectiva(matricula, empresa)) },
  { key: "m_eps", header: "EPS", group: "Matrícula", defaultSelected: true,
    resolver: ({ matricula }) => findLabel([...EPS_OPTIONS], matricula.eps || "") },
  { key: "m_nivel_formacion", header: "Nivel Formación", group: "Matrícula", defaultSelected: true,
    resolver: ({ matricula, resolveNivel }) => matricula.nivelFormacionId ? resolveNivel(matricula.nivelFormacionId) : "" },
  { key: "m_codigo_estudiante", header: "Código Estudiante", group: "Matrícula",
    resolver: ({ matricula }) => matricula.codigoEstudiante || "" },
  { key: "m_fecha_inicio", header: "Fecha Inicio", group: "Matrícula",
    resolver: ({ matricula }) => formatDate(matricula.fechaInicio) },
  { key: "m_fecha_fin", header: "Fecha Fin", group: "Matrícula",
    resolver: ({ matricula }) => formatDate(matricula.fechaFin) },
  { key: "m_fecha_creacion", header: "Fecha Creación", group: "Matrícula",
    resolver: ({ matricula }) => formatDate(matricula.createdAt) },
  { key: "m_nivel_previo", header: "Nivel Previo", group: "Matrícula",
    resolver: ({ matricula }) => matricula.nivelPrevio ? NIVEL_PREVIO_LABELS[matricula.nivelPrevio] : "" },
  { key: "m_centro_previo", header: "Centro Formación Previo", group: "Matrícula",
    resolver: ({ matricula }) => matricula.centroFormacionPrevio || "" },

  // ===== Financiero =====
  { key: "f_valor_cupo", header: "Valor Cupo", group: "Financiero",
    resolver: ({ matricula }) => matricula.valorCupo != null ? String(matricula.valorCupo) : "" },
  { key: "f_abono", header: "Abono", group: "Financiero",
    resolver: ({ matricula }) => matricula.abono != null ? String(matricula.abono) : "" },
  { key: "f_saldo", header: "Saldo", group: "Financiero",
    resolver: ({ matricula }) => matricula.valorCupo != null ? String((matricula.valorCupo ?? 0) - (matricula.abono ?? 0)) : "" },
  { key: "f_pagado", header: "Pagado", group: "Financiero",
    resolver: ({ matricula }) => matricula.pagado ? "Sí" : "No" },
  { key: "f_forma_pago", header: "Forma Pago", group: "Financiero",
    resolver: ({ matricula }) => matricula.formaPago ? (FORMA_PAGO_LABELS[matricula.formaPago] || matricula.formaPago) : "" },
  { key: "f_fecha_pago", header: "Fecha Pago", group: "Financiero",
    resolver: ({ matricula }) => formatDate(matricula.fechaPago) },
  { key: "f_fecha_facturacion", header: "Fecha Facturación", group: "Financiero",
    resolver: ({ matricula }) => formatDate(matricula.fechaFacturacion) },
  { key: "f_cta_fact", header: "No. CTA-FACT", group: "Financiero",
    resolver: ({ matricula }) => matricula.ctaFactNumero || "" },
  { key: "f_cobro_nombre", header: "Contacto Cobro - Nombre", group: "Financiero",
    resolver: ({ matricula }) => capitalize(matricula.cobroContactoNombre || "") },
  { key: "f_cobro_cel", header: "Contacto Cobro - Celular", group: "Financiero",
    resolver: ({ matricula }) => matricula.cobroContactoCelular || "" },

  // ===== Curso =====
  { key: "c_numero", header: "# Curso", group: "Curso", defaultSelected: true,
    resolver: ({ curso }) => curso?.numeroCurso || "" },
  { key: "c_tipo", header: "Tipo de Curso", group: "Curso", defaultSelected: true,
    resolver: ({ curso }) => curso?.tipoFormacion ? (TIPO_FORMACION_LABELS[curso.tipoFormacion] || curso.tipoFormacion) : "" },
  { key: "c_fecha_inicio", header: "Curso - Fecha Inicio", group: "Curso", defaultSelected: true,
    resolver: ({ curso }) => formatDate(curso?.fechaInicio || undefined) },
  { key: "c_fecha_fin", header: "Curso - Fecha Fin", group: "Curso", defaultSelected: true,
    resolver: ({ curso }) => formatDate(curso?.fechaFin || undefined) },
  { key: "c_duracion_dias", header: "Duración (días)", group: "Curso",
    resolver: ({ curso }) => curso?.duracionDias != null ? String(curso.duracionDias) : "" },
  { key: "c_duracion_horas", header: "Duración (horas)", group: "Curso", defaultSelected: true,
    resolver: ({ curso }) => curso?.duracionHoras != null ? String(curso.duracionHoras) : "" },
  { key: "c_entrenador", header: "Entrenador", group: "Curso", defaultSelected: true,
    resolver: ({ curso }) => capitalize(curso?.entrenadorNombre || "") },
];

export const MATRICULA_COLUMN_GROUPS = ["Persona", "Matrícula", "Curso", "Financiero"];

function escapeCsv(val: string): string {
  return (val ?? "").replace(/[\r\n]+/g, " ").replace(/;/g, ",");
}

export interface BuildMatriculasCsvParams {
  matriculas: Matricula[];
  personasMap: Record<string, PersonaResumenExport>;
  empresasMap: Record<string, Empresa>;
  cursosMap?: Record<string, CursoResumenExport>;
  resolveNivel: (id?: string | null) => string;
  columnasSeleccionadas: MatriculaColumnDef[];
}

export interface BuildMatriculasCsvResult {
  content: string;
  filas: number;
  columnas: MatriculaColumnDef[];
}

export function buildMatriculasCsv({
  matriculas,
  personasMap,
  empresasMap,
  cursosMap,
  resolveNivel,
  columnasSeleccionadas,
}: BuildMatriculasCsvParams): BuildMatriculasCsvResult {
  // Mantener orden del catálogo
  const order = new Map(MATRICULA_COLUMN_CATALOG.map((c, i) => [c.key, i]));
  const cols = [...columnasSeleccionadas].sort(
    (a, b) => (order.get(a.key) ?? 999) - (order.get(b.key) ?? 999),
  );

  const header = cols.map((c) => escapeCsv(c.header)).join(";");
  const rows = matriculas
    .map((m) => {
      const persona = personasMap[m.personaId];
      if (!persona) return null;
      const empresa = m.empresaId ? empresasMap[m.empresaId] : undefined;
      const curso = m.cursoId && cursosMap ? cursosMap[m.cursoId] : undefined;
      return cols
        .map((c) => escapeCsv(c.resolver({ persona, matricula: m, empresa, curso, resolveNivel })))
        .join(";");
    })
    .filter((r): r is string => r !== null);

  // BOM UTF-8 para Excel
  const content = "\uFEFF" + [header, ...rows].join("\n");
  return { content, filas: rows.length, columnas: cols };
}
