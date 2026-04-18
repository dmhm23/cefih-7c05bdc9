/**
 * Tipos genéricos del motor de formatos.
 *
 * No referencian ninguna entidad del dominio (Persona, Matricula, Curso, etc.).
 * Los bloques específicos del dominio se modelan vía `props: unknown` y se
 * tipan internamente por sus plugins.
 */

import type { BlockInstance } from '../../contracts/BlockRegistryPort';

export type Bloque = BlockInstance;

export type AsignacionScope = 'todos' | 'nivel_formacion' | 'tipo_curso';
export type MotorRender = 'bloques' | 'plantilla_html';
export type CategoriaFormato = 'formacion' | 'evaluacion' | 'asistencia' | 'pta_ats' | 'personalizado';
export type ModoDiligenciamiento = 'manual_estudiante' | 'manual_admin' | 'automatico_sistema';
export type EstadoFormato = 'borrador' | 'activo' | 'archivado';
export type TipoDependencia = 'activacion' | 'datos' | 'precondicion';
export type CondicionDependencia = 'completado' | 'firmado' | 'aprobado';
export type EventoDisparador = 'asignacion_curso' | 'cierre_curso' | 'firma_completada';

export interface FormatoDependencia {
  formatoId: string;
  tipo: TipoDependencia;
  condicion: CondicionDependencia;
}

export interface EncabezadoConfig {
  mostrarLogo: boolean;
  mostrarNombreCentro: boolean;
  mostrarCodigoDocumento: boolean;
  mostrarVersion: boolean;
  mostrarFecha: boolean;
  mostrarPaginacion: boolean;
  alineacion: 'izquierda' | 'centro' | 'derecha';
}

export interface Formato {
  id: string;
  nombre: string;
  descripcion: string;
  codigo: string;
  version: string;

  asignacionScope: AsignacionScope;
  /** IDs externos (definidos por el host) que delimitan a quién aplica. */
  nivelFormacionIds: string[];

  visibleEnMatricula: boolean;
  visibleEnCurso: boolean;
  visibleEnPortalEstudiante: boolean;
  activo: boolean;
  modoDiligenciamiento: ModoDiligenciamiento;
  esAutomatico: boolean;

  motorRender: MotorRender;
  categoria: CategoriaFormato;
  estado: EstadoFormato;

  htmlTemplate?: string;
  cssTemplate?: string;

  usaEncabezadoInstitucional: boolean;
  encabezadoConfig?: EncabezadoConfig;

  plantillaBaseId?: string;
  tokensUsados?: string[];

  requiereFirmaAprendiz: boolean;
  requiereFirmaEntrenador: boolean;
  requiereFirmaSupervisor: boolean;

  bloques: Bloque[];

  documentMeta?: {
    fechaCreacion: string;
    fechaEdicion: string;
    subsistema: string;
  };

  dependencias: FormatoDependencia[];
  eventosDisparadores: EventoDisparador[];

  /** @deprecated */
  legacyComponentId?: string;

  esOrigenFirma: boolean;

  createdAt: string;
  updatedAt: string;
}

export type FormatoFormData = Omit<Formato, 'id' | 'createdAt' | 'updatedAt'>;

export interface FormatoVersion {
  id: string;
  formatoId: string;
  version: number;
  htmlTemplate: string;
  cssTemplate?: string;
  createdAt: string;
  creadoPor?: string;
}

export interface PlantillaBase {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaFormato;
  htmlTemplate: string;
  cssTemplate?: string;
  thumbnail?: string;
}

export type EstadoRespuesta = 'pendiente' | 'completado' | 'firmado' | 'bloqueado' | 'reabierto';

export interface Respuesta {
  id: string;
  /** ID del subject (matrícula, expediente, ticket...). El core no asume cuál. */
  subjectId: string;
  formatoId: string;
  answers: Record<string, unknown>;
  estado: EstadoRespuesta;
  completadoAt?: string;
  reabiertoPor?: string;
  reabiertoAt?: string;
  intentosEvaluacion?: Record<string, unknown>[];
  createdAt: string;
  updatedAt: string;
}
