import { FileText, Pencil, Plus, Search, Settings2, Upload, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { usePlantillas, useCreatePlantilla } from "@/hooks/usePlantillas";
import { useTiposCertificado, useCreateTipoCertificado, useUpdateTipoCertificado, useDeleteTipoCertificado } from "@/hooks/useTiposCertificado";
import { TIPO_FORMACION_LABELS, type TipoFormacion } from "@/types/curso";
import type { TipoCertificado, ReglaTipoCertificado } from "@/types/certificado";
import { RowActions, createEditAction, createDeleteAction } from "@/components/shared/RowActions";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_REGLAS: ReglaTipoCertificado = {
  requierePago: true,
  requiereDocumentos: true,
  requiereFormatos: true,
  incluyeEmpresa: true,
  incluyeFirmas: true,
};

export default function PlantillasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: plantillas, isLoading: loadingPlantillas } = usePlantillas();
  const { data: tipos, isLoading: loadingTipos } = useTiposCertificado();
  const createPlantillaMutation = useCreatePlantilla();
  const createTipoMutation = useCreateTipoCertificado();
  const updateTipoMutation = useUpdateTipoCertificado();
  const deleteTipoMutation = useDeleteTipoCertificado();

  const [busqueda, setBusqueda] = useState("");
  const [activeTab, setActiveTab] = useState("plantillas");

  // Plantilla dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [svgFile, setSvgFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Tipo dialog
  const [tipoDialogOpen, setTipoDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoCertificado | null>(null);
  const [tipoNombre, setTipoNombre] = useState("");
  const [tipoFormacion, setTipoFormacion] = useState<TipoFormacion>("jefe_area");
  const [tipoPlantillaId, setTipoPlantillaId] = useState("");
  const [tipoReglaCodigo, setTipoReglaCodigo] = useState("{numeroCurso}-{prefijoNivel}-{consecutivoAnual}");
  const [tipoReglas, setTipoReglas] = useState<ReglaTipoCertificado>(DEFAULT_REGLAS);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredPlantillas = (plantillas ?? []).filter(p =>
    !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const filteredTipos = (tipos ?? []).filter(t =>
    !busqueda || t.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleCreatePlantilla = async () => {
    if (!svgFile || !nombre.trim()) return;
    try {
      const svgRaw = await svgFile.text();
      const result = await createPlantillaMutation.mutateAsync({
        nombre: nombre.trim(),
        svgRaw,
        activa: false,
        version: 1,
      });
      toast({ title: 'Plantilla creada', description: `"${result.nombre}" lista para mapear etiquetas.` });
      setDialogOpen(false);
      setNombre("");
      setSvgFile(null);
      navigate(`/certificacion/plantillas/${result.id}/editar`);
    } catch {
      toast({ title: 'Error', description: 'No se pudo crear la plantilla.', variant: 'destructive' });
    }
  };

  const openTipoDialog = (tipo?: TipoCertificado) => {
    if (tipo) {
      setEditingTipo(tipo);
      setTipoNombre(tipo.nombre);
      setTipoFormacion(tipo.tipoFormacion);
      setTipoPlantillaId(tipo.plantillaId);
      setTipoReglaCodigo(tipo.reglaCodigo);
      setTipoReglas({ ...tipo.reglas });
    } else {
      setEditingTipo(null);
      setTipoNombre("");
      setTipoFormacion("jefe_area");
      setTipoPlantillaId(plantillas?.[0]?.id ?? "");
      setTipoReglaCodigo("{numeroCurso}-{prefijoNivel}-{consecutivoAnual}");
      setTipoReglas({ ...DEFAULT_REGLAS });
    }
    setTipoDialogOpen(true);
  };

  const handleSaveTipo = async () => {
    if (!tipoNombre.trim() || !tipoPlantillaId) return;
    const data = {
      nombre: tipoNombre.trim(),
      tipoFormacion,
      plantillaId: tipoPlantillaId,
      reglaCodigo: tipoReglaCodigo,
      reglas: tipoReglas,
    };
    try {
      if (editingTipo) {
        await updateTipoMutation.mutateAsync({ id: editingTipo.id, data });
        toast({ title: 'Tipo actualizado' });
      } else {
        await createTipoMutation.mutateAsync(data);
        toast({ title: 'Tipo creado' });
      }
      setTipoDialogOpen(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar el tipo.', variant: 'destructive' });
    }
  };

  const handleDeleteTipo = async () => {
    if (!deleteId) return;
    try {
      await deleteTipoMutation.mutateAsync(deleteId);
      toast({ title: 'Tipo eliminado' });
      setDeleteId(null);
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar.', variant: 'destructive' });
    }
  };

  const isSaving = createTipoMutation.isPending || updateTipoMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Plantillas de Certificado</h1>
            <p className="text-sm text-muted-foreground">Gestión de plantillas SVG y tipos de certificado</p>
          </div>
        </div>
        {activeTab === "plantillas" ? (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Plantilla
          </Button>
        ) : (
          <Button onClick={() => openTipoDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Tipo
          </Button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-9" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plantillas">
            <FileText className="h-4 w-4 mr-1" />
            Plantillas
          </TabsTrigger>
          <TabsTrigger value="tipos">
            <Settings2 className="h-4 w-4 mr-1" />
            Tipos de Certificado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plantillas" className="mt-4">
          {loadingPlantillas ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredPlantillas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">Sin plantillas</p>
              <p className="text-sm">Sube una plantilla SVG para comenzar a generar certificados.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Versión</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlantillas.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell>
                      <Badge variant={p.activa ? "default" : "secondary"}>{p.activa ? "Activa" : "Inactiva"}</Badge>
                    </TableCell>
                    <TableCell>{p.tokensDetectados.length}</TableCell>
                    <TableCell>v{p.version}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/certificacion/plantillas/${p.id}/editar`)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="tipos" className="mt-4">
          {loadingTipos ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredTipos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Settings2 className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">Sin tipos de certificado</p>
              <p className="text-sm">Crea un tipo para asociar reglas y plantillas.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo de Formación</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Docs</TableHead>
                  <TableHead>Formatos</TableHead>
                  <TableHead>Regla Código</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTipos.map(t => (
                  <TableRow key={t.id} className="group">
                    <TableCell className="font-medium">{t.nombre}</TableCell>
                    <TableCell>{TIPO_FORMACION_LABELS[t.tipoFormacion] || t.tipoFormacion}</TableCell>
                    <TableCell>
                      <Badge variant={t.reglas.requierePago ? "default" : "secondary"}>
                        {t.reglas.requierePago ? "Sí" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.reglas.requiereDocumentos ? "default" : "secondary"}>
                        {t.reglas.requiereDocumentos ? "Sí" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.reglas.requiereFormatos ? "default" : "secondary"}>
                        {t.reglas.requiereFormatos ? "Sí" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{t.reglaCodigo}</TableCell>
                    <TableCell>
                      <RowActions
                        actions={[
                          createEditAction(() => openTipoDialog(t)),
                          createDeleteAction(() => setDeleteId(t.id)),
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Nueva Plantilla */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Plantilla SVG</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nombre-plantilla">Nombre</Label>
              <Input
                id="nombre-plantilla"
                placeholder="Ej: Certificado Trabajo en Alturas"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Archivo SVG</Label>
              <input
                ref={fileRef}
                type="file"
                accept=".svg"
                className="hidden"
                onChange={e => setSvgFile(e.target.files?.[0] || null)}
              />
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {svgFile ? svgFile.name : 'Seleccionar archivo SVG'}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreatePlantilla} disabled={!nombre.trim() || !svgFile || createPlantillaMutation.isPending}>
              Crear y mapear etiquetas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Crear/Editar Tipo de Certificado */}
      <Dialog open={tipoDialogOpen} onOpenChange={setTipoDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTipo ? "Editar Tipo de Certificado" : "Nuevo Tipo de Certificado"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                placeholder="Ej: Certificado Trabajo en Alturas"
                value={tipoNombre}
                onChange={e => setTipoNombre(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Formación</Label>
              <Select value={tipoFormacion} onValueChange={(v) => setTipoFormacion(v as TipoFormacion)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="bottom">
                  {Object.entries(TIPO_FORMACION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plantilla vinculada</Label>
              <Select value={tipoPlantillaId} onValueChange={setTipoPlantillaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plantilla" />
                </SelectTrigger>
                <SelectContent side="bottom">
                  {(plantillas ?? []).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Regla de código</Label>
              <Input
                placeholder="{numeroCurso}-{prefijoNivel}-{consecutivoAnual}"
                value={tipoReglaCodigo}
                onChange={e => setTipoReglaCodigo(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Patrón para generar el código único del certificado</p>
            </div>
            <div className="space-y-3 pt-2">
              <Label className="text-sm font-medium">Reglas de validación</Label>
              {([
                { key: 'requierePago', label: 'Requiere pago completo' },
                { key: 'requiereDocumentos', label: 'Requiere documentos completos' },
                { key: 'requiereFormatos', label: 'Requiere formatos firmados' },
                { key: 'incluyeEmpresa', label: 'Incluye datos de empresa' },
                { key: 'incluyeFirmas', label: 'Incluye firmas' },
              ] as const).map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-sm font-normal">{label}</Label>
                  <Switch
                    checked={tipoReglas[key]}
                    onCheckedChange={(checked) => setTipoReglas(prev => ({ ...prev, [key]: checked }))}
                  />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTipoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveTipo} disabled={!tipoNombre.trim() || !tipoPlantillaId || isSaving}>
              {editingTipo ? "Guardar cambios" : "Crear tipo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar tipo de certificado"
        description="¿Estás seguro de que deseas eliminar este tipo de certificado? Esta acción no se puede deshacer."
        onConfirm={handleDeleteTipo}
        confirmLabel="Eliminar"
        variant="destructive"
      />
    </div>
  );
}