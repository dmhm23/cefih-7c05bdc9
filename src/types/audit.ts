export type TipoEntidad = 'persona' | 'matricula' | 'curso' | 'comentario' | 'nivel_formacion';
export type TipoAccion = 'crear' | 'editar' | 'eliminar';

export interface AuditLog {
  id: string;
  entidadTipo: TipoEntidad;
  entidadId: string;
  accion: TipoAccion;
  camposModificados?: string[];
  valorAnterior?: Record<string, unknown>;
  valorNuevo?: Record<string, unknown>;
  usuarioId: string;
  usuarioNombre: string;
  timestamp: string;
}
