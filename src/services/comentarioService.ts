import { supabase } from '@/integrations/supabase/client';
import { Comentario, SeccionComentario } from '@/types/comentario';

export const comentarioService = {
  async getByEntidadSeccion(entidadId: string, seccion: SeccionComentario): Promise<Comentario[]> {
    const { data, error } = await supabase
      .from('comentarios')
      .select('*')
      .eq('entidad_id', entidadId)
      .eq('seccion', seccion)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((c) => ({
      id: c.id,
      entidadId: c.entidad_id,
      seccion: c.seccion as SeccionComentario,
      texto: c.texto,
      usuarioId: c.usuario_id || '',
      usuarioNombre: c.usuario_nombre,
      creadoEn: c.created_at,
      editadoEn: c.editado_en || undefined,
    }));
  },

  async create(data: Omit<Comentario, 'id' | 'creadoEn'>): Promise<Comentario> {
    const { data: inserted, error } = await supabase
      .from('comentarios')
      .insert({
        entidad_tipo: 'generic',
        entidad_id: data.entidadId,
        seccion: data.seccion,
        texto: data.texto,
        usuario_id: data.usuarioId || null,
        usuario_nombre: data.usuarioNombre,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: inserted.id,
      entidadId: inserted.entidad_id,
      seccion: inserted.seccion as SeccionComentario,
      texto: inserted.texto,
      usuarioId: inserted.usuario_id || '',
      usuarioNombre: inserted.usuario_nombre,
      creadoEn: inserted.created_at,
    };
  },

  async update(id: string, texto: string): Promise<Comentario> {
    const { data: updated, error } = await supabase
      .from('comentarios')
      .update({ texto, editado_en: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: updated.id,
      entidadId: updated.entidad_id,
      seccion: updated.seccion as SeccionComentario,
      texto: updated.texto,
      usuarioId: updated.usuario_id || '',
      usuarioNombre: updated.usuario_nombre,
      creadoEn: updated.created_at,
      editadoEn: updated.editado_en || undefined,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('comentarios')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
