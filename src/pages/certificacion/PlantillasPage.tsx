import { FileText, Pencil, Plus, Search } from "lucide-react";
import { FileDropZone } from "@/components/shared/FileDropZone";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { usePlantillas, useCreatePlantilla } from "@/hooks/usePlantillas";
import { useNivelesFormacion } from "@/hooks/useNivelesFormacion";
import { type TipoFormacion } from "@/types/curso";
import { resolveNivelCursoLabel, getNivelesAsOptions } from "@/utils/resolveNivelLabel";
import type { ReglaTipoCertificado } from "@/types/certificado";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_REGLAS: ReglaTipoCertificado = {
  requierePago: true,
  requiereDocumentos: true,
  requiereFormatos: true,
  incluyeEmpresa: true,
  incluyeFirmas: true,
};

const REGLA_LABELS: { key: keyof ReglaTipoCertificado; label: string }[] = [
  { key: 'requierePago', label: 'Requiere pago completo' },
  { key: 'requiereDocumentos', label: 'Requiere documentos completos' },
  { key: 'requiereFormatos', label: 'Requiere formatos firmados' },
  { key: 'incluyeEmpresa', label: 'Incluye datos de empresa' },
  { key: 'incluyeFirmas', label: 'Incluye firmas' },
];

export default function PlantillasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: plantillas, isLoading } = usePlantillas();
  const { data: niveles = [] } = useNivelesFormacion();
  const createPlantillaMutation = useCreatePlantilla();

  const [busqueda, setBusqueda] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [svgFile, setSvgFile] = useState<File | null>(null);
  const [tipoFormacion, setTipoFormacion] = useState<TipoFormacion>("jefe_area");
  const [reglaCodigo, setReglaCodigo] = useState("{numeroCurso}-{prefijoNivel}-{consecutivoAnual}");
  const [reglas, setReglas] = useState<ReglaTipoCertificado>({ ...DEFAULT_REGLAS });
  const [nivelesAsignados, setNivelesAsignados] = useState<string[]>([]);
  

  const filteredPlantillas = (plantillas ?? []).filter(p =>
    !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const resetDialog = () => {
    setNombre("");
    setSvgFile(null);
    setTipoFormacion("jefe_area");
    setReglaCodigo("{numeroCurso}-{prefijoNivel}-{consecutivoAnual}");
    setReglas({ ...DEFAULT_REGLAS });
    setNivelesAsignados([]);
  };

  const handleCreatePlantilla = async () => {
    if (!svgFile || !nombre.trim()) return;
    try {
      const svgRaw = await svgFile.text();
      const result = await createPlantillaMutation.mutateAsync({
        nombre: nombre.trim(),
        svgRaw,
        activa: false,
        version: 1,
        tipoFormacion,
        reglaCodigo,
        reglas,
        nivelesAsignados,
      });
      toast({ title: 'Plantilla creada', description: `"${result.nombre}" lista para mapear etiquetas.` });
      setDialogOpen(false);
      resetDialog();
      navigate(`/certificacion/plantillas/${result.id}/editar`);
    } catch {
      toast({ title: 'Error', description: 'No se pudo crear la plantilla.', variant: 'destructive' });
    }
  };

  const toggleNivel = (id: string) => {
    setNivelesAsignados(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Plantillas de Certificado</h1>
            <p className="text-sm text-muted-foreground">Gestión de plantillas SVG con reglas de emisión integradas</p>
          </div>
        </div>
        <Button onClick={() => { resetDialog(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar plantillas..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
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
              <TableHead>Tipo de Formación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>Versión</TableHead>
              <TableHead>Niveles</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlantillas.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nombre}</TableCell>
                <TableCell>{TIPO_FORMACION_LABELS[p.tipoFormacion] || p.tipoFormacion}</TableCell>
                <TableCell>
                  <Badge variant={p.activa ? "default" : "secondary"}>{p.activa ? "Activa" : "Inactiva"}</Badge>
                </TableCell>
                <TableCell>{p.tokensDetectados.length}</TableCell>
                <TableCell>v{p.version}</TableCell>
                <TableCell>
                  {p.nivelesAsignados.length > 0 ? (
                    <Badge variant="outline" className="text-xs">{p.nivelesAsignados.length} niveles</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
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

      {/* Dialog: Nueva Plantilla */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Plantilla de Certificado</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre-plantilla">Nombre</Label>
              <Input
                id="nombre-plantilla"
                placeholder="Ej: Certificado Trabajo en Alturas"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
            </div>

            {/* Archivo SVG */}
            <div className="space-y-2">
              <Label>Archivo SVG</Label>
              <FileDropZone
                accept=".svg"
                onFile={setSvgFile}
                file={svgFile}
                onClear={() => setSvgFile(null)}
                label="Arrastra el SVG aquí o haz clic para seleccionar"
                hint="Archivo SVG de la plantilla"
              />
            </div>

            {/* Tipo de formación */}
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

            {/* Regla de código */}
            <div className="space-y-2">
              <Label>Regla de código</Label>
              <Input
                placeholder="{numeroCurso}-{prefijoNivel}-{consecutivoAnual}"
                value={reglaCodigo}
                onChange={e => setReglaCodigo(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Patrón para generar el código único del certificado</p>
            </div>

            {/* Reglas de validación */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Reglas de validación</Label>
              {REGLA_LABELS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-sm font-normal">{label}</Label>
                  <Switch
                    checked={reglas[key]}
                    onCheckedChange={(checked) => setReglas(prev => ({ ...prev, [key]: checked }))}
                  />
                </div>
              ))}
            </div>

            {/* Niveles asignados */}
            {niveles.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Niveles de formación asignados</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {niveles.map(n => (
                    <div key={n.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`nivel-${n.id}`}
                        checked={nivelesAsignados.includes(n.id)}
                        onCheckedChange={() => toggleNivel(n.id)}
                      />
                      <Label htmlFor={`nivel-${n.id}`} className="text-sm font-normal cursor-pointer">
                        {n.nombreNivel}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreatePlantilla} disabled={!nombre.trim() || !svgFile || createPlantillaMutation.isPending}>
              Crear y mapear etiquetas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
