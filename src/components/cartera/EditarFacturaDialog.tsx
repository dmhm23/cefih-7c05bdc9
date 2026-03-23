import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Users, Eye } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FileDropZone } from "@/components/shared/FileDropZone";
import { ArchivoPreviewDialog } from "./ArchivoPreviewDialog";
import { DateField } from "@/components/shared/DateField";
import { useUpdateFactura, useDeleteFactura } from "@/hooks/useCartera";
import { Factura } from "@/types/cartera";
import { Matricula } from "@/types/matricula";
import { Persona } from "@/types/persona";
import { Curso } from "@/types/curso";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factura: Factura | null;
  matriculas?: Matricula[];
  personas?: Persona[];
  cursos?: Curso[];
}

export function EditarFacturaDialog({ open, onOpenChange, factura, matriculas = [], personas = [], cursos = [] }: Props) {
  const { toast } = useToast();
  const updateFactura = useUpdateFactura();
  const deleteFactura = useDeleteFactura();

  const [numeroFactura, setNumeroFactura] = useState("");
  const [fechaEmision, setFechaEmision] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [total, setTotal] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivoUrl, setArchivoUrl] = useState<string | undefined>(undefined);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (factura) {
      setNumeroFactura(factura.numeroFactura);
      setFechaEmision(factura.fechaEmision);
      setFechaVencimiento(factura.fechaVencimiento);
      setTotal(String(factura.total));
      setArchivoUrl(factura.archivoFactura);
      setArchivo(null);
    }
  }, [factura]);

  const linkedMatriculas = useMemo(() => {
    if (!factura?.matriculaIds?.length) return [];
    return matriculas.filter(m => factura.matriculaIds.includes(m.id));
  }, [factura, matriculas]);

  const getPersona = (personaId: string) => personas.find(p => p.id === personaId);
  const getCurso = (cursoId: string) => cursos.find(c => c.id === cursoId);

  const handleSubmit = async () => {
    if (!factura || !numeroFactura || !fechaVencimiento || !total) {
      toast({ title: "Complete los campos requeridos", variant: "destructive" });
      return;
    }

    const newArchivoUrl = archivo ? URL.createObjectURL(archivo) : archivoUrl;

    await updateFactura.mutateAsync({
      id: factura.id,
      data: {
        numeroFactura,
        fechaEmision,
        fechaVencimiento,
        total: parseFloat(total),
        archivoFactura: newArchivoUrl,
      },
    });

    toast({ title: "Factura actualizada exitosamente" });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!factura) return;
    await deleteFactura.mutateAsync(factura.id);
    toast({ title: "Factura eliminada exitosamente" });
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  if (!factura) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Factura</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="editNumFactura">No. Factura *</Label>
              <Input
                id="editNumFactura"
                value={numeroFactura}
                onChange={e => setNumeroFactura(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editTotal">Total *</Label>
              <Input
                id="editTotal"
                type="number"
                value={total}
                onChange={e => setTotal(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="editFechaEmision">Fecha Emisión</Label>
                <Input
                  id="editFechaEmision"
                  type="date"
                  value={fechaEmision}
                  onChange={e => setFechaEmision(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editFechaVenc">Fecha Vencimiento *</Label>
                <Input
                  id="editFechaVenc"
                  type="date"
                  value={fechaVencimiento}
                  onChange={e => setFechaVencimiento(e.target.value)}
                />
              </div>
            </div>

            {/* Archivo de factura */}
            <div className="space-y-1.5">
              <Label>Archivo de Factura</Label>
              {!archivo && archivoUrl ? (
                <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-muted/20 min-w-0 overflow-hidden">
                  <span className="text-sm flex-1 truncate min-w-0">Archivo adjunto</span>
                  <Button variant="ghost" size="sm" className="gap-1.5 h-7 shrink-0" onClick={() => setShowPreview(true)}>
                    <Eye className="h-3.5 w-3.5" />
                    Ver
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-destructive shrink-0" onClick={() => { setArchivoUrl(undefined); }}>
                    Quitar
                  </Button>
                </div>
              ) : (
                <FileDropZone
                  accept=".pdf,.png,.jpg,.jpeg"
                  onFile={(f) => { setArchivo(f); setArchivoUrl(URL.createObjectURL(f)); }}
                  file={archivo}
                  onClear={() => { setArchivo(null); setArchivoUrl(undefined); }}
                  label="Arrastra la factura aquí o haz clic para seleccionar"
                  hint="PDF, PNG, JPG"
                />
              )}
            </div>

            {/* Matrículas vinculadas (read-only) */}
            {linkedMatriculas.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Matrículas vinculadas
                </Label>
                <div className="border rounded-md divide-y max-h-36 overflow-y-auto">
                  {linkedMatriculas.map(m => {
                    const persona = getPersona(m.personaId);
                    const curso = getCurso(m.cursoId);
                    const nombre = persona ? `${persona.nombres} ${persona.apellidos}` : m.personaId;
                    return (
                      <div key={m.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{nombre}</span>
                          {curso && (
                            <span className="text-xs text-muted-foreground ml-2">{curso.nombre}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex !justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={updateFactura.isPending}>
                {updateFactura.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Eliminar Factura"
        description={`¿Está seguro de eliminar la factura ${factura.numeroFactura}? Se eliminarán también todos los pagos asociados y se recalcularán los saldos del grupo. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />
      <ArchivoPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        url={archivoUrl || null}
        nombre={`Factura ${factura.numeroFactura}`}
      />
    </>
  );
}
