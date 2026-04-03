export type TipoEntidad = 'persona' | 'matricula' | 'curso' | 'comentario' | 'nivel_formacion' | 'personal' | 'cargo' | 'certificado' | 'plantilla_certificado' | 'excepcion_certificado' | 'empresa' | 'formato_formacion' | 'tarifa_empresa' | 'factura' | 'pago' | 'grupo_cartera';
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
  justificacion?: string;
  timestamp: string;
}
