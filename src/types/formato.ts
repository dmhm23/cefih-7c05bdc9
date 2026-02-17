export type EstadoFormato = 'borrador' | 'completo';

export interface FormatoDocumento {
  id: string;
  nombre: string;
  estado: EstadoFormato;
  tipo: 'info_aprendiz' | 'registro_asistencia' | 'participacion_pta_ats';
}
