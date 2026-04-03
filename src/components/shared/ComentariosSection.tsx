import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare, ChevronDown, ChevronUp, Pencil, Trash2, Send, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useComentarios, useCreateComentario, useUpdateComentario, useDeleteComentario } from "@/hooks/useComentarios";
import { SeccionComentario } from "@/types/comentario";
import { useToast } from "@/hooks/use-toast";

interface ComentariosSectionProps {
  entidadId: string;
  seccion: SeccionComentario;
  titulo?: string;
}

const VISIBLE_COUNT = 3;

export function ComentariosSection({ entidadId, seccion, titulo = "Comentarios" }: ComentariosSectionProps) {
  const { data: comentarios = [], isLoading } = useComentarios(entidadId, seccion);
  const createComentario = useCreateComentario();
  const updateComentario = useUpdateComentario();
  const deleteComentario = useDeleteComentario();
  const { toast } = useToast();

  const [nuevoTexto, setNuevoTexto] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTexto, setEditingTexto] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAgregar = async () => {
    const texto = nuevoTexto.trim();
    if (!texto) return;
    try {
      await createComentario.mutateAsync({
        matriculaId,
        seccion,
        texto,
        usuarioId: "admin1",
        usuarioNombre: "Administrador Sistema",
      });
      setNuevoTexto("");
      toast({ title: "Comentario agregado" });
    } catch {
      toast({ title: "Error al agregar comentario", variant: "destructive" });
    }
  };

  const handleGuardarEdicion = async () => {
    if (!editingId || !editingTexto.trim()) return;
    try {
      await updateComentario.mutateAsync({ id: editingId, texto: editingTexto.trim() });
      setEditingId(null);
      setEditingTexto("");
      toast({ title: "Comentario actualizado" });
    } catch {
      toast({ title: "Error al actualizar comentario", variant: "destructive" });
    }
  };

  const handleEliminar = async () => {
    if (!deleteId) return;
    try {
      await deleteComentario.mutateAsync(deleteId);
      setDeleteId(null);
      toast({ title: "Comentario eliminado" });
    } catch {
      toast({ title: "Error al eliminar comentario", variant: "destructive" });
    }
  };

  const visibleComments = expanded ? comentarios : comentarios.slice(0, VISIBLE_COUNT);
  const hasMore = comentarios.length > VISIBLE_COUNT;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</h4>
          {comentarios.length > 0 && (
            <span className="text-xs text-muted-foreground">({comentarios.length})</span>
          )}
        </div>
        {comentarios.length > 0 && (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            {collapsed ? "Expandir" : "Colapsar"}
          </Button>
        )}
      </div>

      {/* Input nuevo comentario */}
      <div className="flex gap-2">
        <Textarea
          value={nuevoTexto}
          onChange={(e) => setNuevoTexto(e.target.value)}
          placeholder="Escriba un comentario..."
          className="min-h-[60px] text-sm resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAgregar();
            }
          }}
        />
        <Button
          size="sm"
          className="shrink-0 self-end"
          onClick={handleAgregar}
          disabled={!nuevoTexto.trim() || createComentario.isPending}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Lista de comentarios */}
      {!collapsed && !isLoading && (
        <div className="space-y-2">
          {visibleComments.map((c) => (
            <div key={c.id} className="border rounded-md p-3 space-y-1 bg-muted/30">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-foreground">
                  {c.usuarioNombre}
                  <span className="text-muted-foreground font-normal ml-2">
                    {format(new Date(c.creadoEn), "d MMM yyyy, HH:mm", { locale: es })}
                    {c.editadoEn && " (editado)"}
                  </span>
                </p>
                {editingId !== c.id && (
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => { setEditingId(c.id); setEditingTexto(c.texto); }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(c.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {editingId === c.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editingTexto}
                    onChange={(e) => setEditingTexto(e.target.value)}
                    className="min-h-[50px] text-sm resize-none"
                    autoFocus
                  />
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingId(null)}>
                      <X className="h-3 w-3 mr-1" /> Cancelar
                    </Button>
                    <Button size="sm" className="h-7 px-2 text-xs" onClick={handleGuardarEdicion} disabled={updateComentario.isPending}>
                      <Check className="h-3 w-3 mr-1" /> Guardar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-foreground whitespace-pre-wrap">{c.texto}</p>
              )}
            </div>
          ))}

          {hasMore && !expanded && (
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setExpanded(true)}>
              <ChevronDown className="h-3 w-3 mr-1" />
              Ver todos los comentarios ({comentarios.length})
            </Button>
          )}
          {hasMore && expanded && (
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setExpanded(false)}>
              <ChevronUp className="h-3 w-3 mr-1" />
              Mostrar menos
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Eliminar comentario"
        description="¿Está seguro de que desea eliminar este comentario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={handleEliminar}
        variant="destructive"
      />
    </div>
  );
}
