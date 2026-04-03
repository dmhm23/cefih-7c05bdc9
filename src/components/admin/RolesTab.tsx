import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Shield, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { MODULOS_CATALOGO } from "@/types/roles";
import { useRoles } from "@/hooks/useRoles";
import { rolesService } from "@/services/rolesService";

const ACCIONES_LABELS: Record<string, string> = {
  ver: "Ver",
  crear: "Crear",
  editar: "Editar",
  eliminar: "Eliminar",
};

const ALL_ACCIONES = ["ver", "crear", "editar", "eliminar"];

export default function RolesTab() {
  const { rolesQuery, createRol, updateRol, deleteRol } = useRoles();
  const roles = rolesQuery.data || [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [permisos, setPermisos] = useState<Record<string, Set<string>>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setNombre("");
    setDescripcion("");
    setPermisos({});
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = async (rolId: string) => {
    const rol = roles.find((r) => r.id === rolId);
    if (!rol) return;
    setEditingId(rolId);
    setNombre(rol.nombre);
    setDescripcion(rol.descripcion || "");

    const permData = await rolesService.getPermisos(rolId);
    const map: Record<string, Set<string>> = {};
    permData.forEach((p) => {
      if (!map[p.modulo]) map[p.modulo] = new Set();
      map[p.modulo].add(p.accion);
    });
    setPermisos(map);
    setDialogOpen(true);
  };

  const togglePermiso = (modulo: string, accion: string) => {
    setPermisos((prev) => {
      const next = { ...prev };
      if (!next[modulo]) next[modulo] = new Set();
      else next[modulo] = new Set(next[modulo]);

      if (next[modulo].has(accion)) {
        next[modulo].delete(accion);
      } else {
        next[modulo].add(accion);
      }
      return next;
    });
  };

  const toggleAllModulo = (modulo: string, acciones: readonly string[]) => {
    setPermisos((prev) => {
      const next = { ...prev };
      const current = next[modulo] || new Set();
      const allChecked = acciones.every((a) => current.has(a));

      if (allChecked) {
        next[modulo] = new Set();
      } else {
        next[modulo] = new Set(acciones);
      }
      return next;
    });
  };

  const handleSave = async () => {
    const permList = Object.entries(permisos).flatMap(([modulo, acciones]) =>
      Array.from(acciones).map((accion) => ({ modulo, accion }))
    );

    setIsSaving(true);
    try {
      if (editingId) {
        await updateRol.mutateAsync({ id: editingId, nombre, descripcion, permisos: permList });
      } else {
        await createRol.mutateAsync({ nombre, descripcion, permisos: permList });
      }
      setDialogOpen(false);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteRol.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const editingRol = editingId ? roles.find((r) => r.id === editingId) : null;
  const isSistema = editingRol?.es_sistema || false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Roles del Sistema</h2>
          <p className="text-sm text-muted-foreground">Gestiona los roles y sus permisos por módulo</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Crear Rol
        </Button>
      </div>

      {/* Roles grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((rol) => (
          <div key={rol.id} className="bg-card border border-border rounded-lg p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {rol.es_sistema ? (
                  <ShieldCheck className="w-5 h-5 text-destructive" />
                ) : (
                  <Shield className="w-5 h-5 text-muted-foreground" />
                )}
                <h3 className="font-semibold text-foreground capitalize">{rol.nombre}</h3>
              </div>
              {rol.es_sistema && (
                <Badge variant="secondary" className="text-xs">Sistema</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{rol.descripcion || "Sin descripción"}</p>
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {rol.usuarios_count || 0} usuario(s)
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(rol.id)}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                {!rol.es_sistema && (
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(rol.id)}
                    className="text-destructive hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Rol" : "Crear Nuevo Rol"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Modifica los permisos asignados a este rol" : "Define un nombre y configura los permisos del nuevo rol"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del Rol *</label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Asistente Cartera"
                  disabled={isSistema}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <Input
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción breve del rol"
                />
              </div>
            </div>

            {/* Permissions grid */}
            {editingRol?.nombre !== "superadministrador" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Permisos por Módulo</label>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Módulo</th>
                        {ALL_ACCIONES.map((a) => (
                          <th key={a} className="text-center p-3 text-xs font-medium uppercase tracking-wider text-muted-foreground w-20">
                            {ACCIONES_LABELS[a]}
                          </th>
                        ))}
                        <th className="text-center p-3 text-xs font-medium uppercase tracking-wider text-muted-foreground w-16">Todos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MODULOS_CATALOGO.map((mod) => {
                        const modPerms = permisos[mod.key] || new Set();
                        const allChecked = mod.acciones.every((a) => modPerms.has(a));
                        return (
                          <tr key={mod.key} className="border-t border-border/50 hover:bg-muted/30">
                            <td className="p-3 font-medium">{mod.label}</td>
                            {ALL_ACCIONES.map((a) => {
                              const available = mod.acciones.includes(a as any);
                              return (
                                <td key={a} className="text-center p-3">
                                  {available ? (
                                    <Checkbox
                                      checked={modPerms.has(a)}
                                      onCheckedChange={() => togglePermiso(mod.key, a)}
                                    />
                                  ) : (
                                    <span className="text-muted-foreground/30">—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="text-center p-3">
                              <Checkbox
                                checked={allChecked}
                                onCheckedChange={() => toggleAllModulo(mod.key, mod.acciones)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {editingRol?.nombre === "superadministrador" && (
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <ShieldCheck className="w-4 h-4 inline mr-2" />
                El superadministrador tiene acceso total implícito. No es necesario configurar permisos.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!nombre.trim() || isSaving}>
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : editingId ? "Guardar Cambios" : "Crear Rol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar Rol"
        description="¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        confirmText="Eliminar"
        variant="destructive"
      />
    </div>
  );
}
