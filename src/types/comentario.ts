export type SeccionComentario = 'cartera' | 'observaciones';

export interface Comentario {
  id: string;
  matriculaId: string;
  seccion: SeccionComentario;
  texto: string;
  usuarioId: string;
  usuarioNombre: string;
  creadoEn: string;
  editadoEn?: string;
}
