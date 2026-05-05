import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Check, X, Building2, Briefcase } from "lucide-react";
import { useCatalogo, useCatalogoMutations } from "@/hooks/useCatalogo";
import type { CatalogoNombre, CatalogoOpcion } from "@/services/catalogoService";
import { useToast } from "@/hooks/use-toast";

function CatalogoTab({ catalogo, titulo }: { catalogo: CatalogoNombre; titulo: string }) {
  const { data: opciones = [], isLoading } = useCatalogo(catalogo, { onlyActive: false });
  const { create, updateLabel, setActivo } = useCatalogoMutations(catalogo);
  const { toast } = useToast();

  const [openCreate, setOpenCreate] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  const handleCreate = async () => {
    if (!newLabel.trim()) return;
    try {
      await create.mutateAsync(newLabel);
      toast({ title: "Opción creada", description: newLabel });
      setNewLabel("");
      setOpenCreate(false);
    } catch (e: any) {
      toast({ title: "Error al crear", description: e.message, variant: "destructive" });
    }
  };

  const startEdit = (o: CatalogoOpcion) => {
    setEditingId(o.id);
    setEditingLabel(o.label);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateLabel.mutateAsync({ id: editingId, label: editingLabel });
      toast({ title: "Nombre actualizado" });
      setEditingId(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const toggleActivo = async (o: CatalogoOpcion) => {
    try {
      await setActivo.mutateAsync({ id: o.id, activo: !o.activo });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona las opciones disponibles. Las opciones inactivas no aparecen en nuevos formularios pero
            siguen mostrándose correctamente en registros antiguos.
          </p>
        </div>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Nueva opción</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva opción de {titulo.toLowerCase()}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre visible</label>
              <Input
                autoFocus
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ej. ARL Nueva"
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={!newLabel.trim() || create.isPending}>
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-48">Identificador</TableHead>
              <TableHead className="w-24">Tipo</TableHead>
              <TableHead className="w-32">Activo</TableHead>
              <TableHead className="w-32 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : opciones.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Sin opciones</TableCell></TableRow>
            ) : opciones.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  {editingId === o.id ? (
                    <div className="flex gap-2">
                      <Input
                        autoFocus
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <Button size="icon" variant="ghost" onClick={saveEdit}><Check className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                    </div>
                  ) : (
                    <span className={o.activo ? "" : "text-muted-foreground line-through"}>{o.label}</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{o.value}</TableCell>
                <TableCell>
                  {o.es_base ? <Badge variant="secondary">Base</Badge> : <Badge variant="outline">Personalizada</Badge>}
                </TableCell>
                <TableCell>
                  <Switch checked={o.activo} onCheckedChange={() => toggleActivo(o)} />
                </TableCell>
                <TableCell className="text-right">
                  {editingId !== o.id && (
                    <Button variant="ghost" size="icon" onClick={() => startEdit(o)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function CatalogosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Catálogos</h1>
        <p className="text-muted-foreground mt-1">
          Administra opciones reutilizables para ARL y Sector económico.
        </p>
      </div>

      <Tabs defaultValue="arl" className="space-y-6">
        <TabsList>
          <TabsTrigger value="arl" className="gap-2">
            <Building2 className="w-4 h-4" /> ARL
          </TabsTrigger>
          <TabsTrigger value="sector" className="gap-2">
            <Briefcase className="w-4 h-4" /> Sector económico
          </TabsTrigger>
        </TabsList>
        <TabsContent value="arl">
          <CatalogoTab catalogo="arl" titulo="ARL" />
        </TabsContent>
        <TabsContent value="sector">
          <CatalogoTab catalogo="sector_economico" titulo="Sector económico" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
