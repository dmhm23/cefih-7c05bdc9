export type SeccionComentario = 'cartera' | 'observaciones' | 'curso_observaciones';

export interface Comentario {
  id: string;
  /** Generic entity ID — works for matrícula, curso, or any entity */
  entidadId: string;
  seccion: SeccionComentario;
  texto: string;
  usuarioId: string;
  usuarioNombre: string;
  creadoEn: string;
  editadoEn?: string;
}
