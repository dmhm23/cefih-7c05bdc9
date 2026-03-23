import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Eye } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FileDropZone } from "@/components/shared/FileDropZone";
import { ArchivoPreviewDialog } from "./ArchivoPreviewDialog";
import { DateField } from "@/components/shared/DateField";
import { useUpdatePago, useDeletePago } from "@/hooks/useCartera";
import { RegistroPago, MetodoPago, METODO_PAGO_LABELS } from "@/types/cartera";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pago: RegistroPago | null;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(v);

export function EditarPagoDialog({ open, onOpenChange, pago }: Props) {
  const { toast } = useToast();
  const updatePago = useUpdatePago();
  const deletePago = useDeletePago();

  const [fechaPago, setFechaPago] = useState("");
  const [valorPago, setValorPago] = useState("");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("transferencia");
  const [observaciones, setObservaciones] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [soporteUrl, setSoporteUrl] = useState<string | undefined>(undefined);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (pago) {
      setFechaPago(pago.fechaPago);
      setValorPago(String(pago.valorPago));
      setMetodoPago(pago.metodoPago);
      setObservaciones(pago.observaciones || "");
      setSoporteUrl(pago.soportePago);
      setArchivo(null);
    }
  }, [pago]);

  const handleSubmit = async () => {
    if (!pago || !valorPago || parseFloat(valorPago) <= 0) {
      toast({ title: "Complete los campos requeridos", variant: "destructive" });
      return;
    }

    const newSoporteUrl = archivo ? URL.createObjectURL(archivo) : soporteUrl;

    await updatePago.mutateAsync({
      id: pago.id,
      data: {
        fechaPago,
        valorPago: parseFloat(valorPago),
        metodoPago,
        observaciones: observaciones || undefined,
        soportePago: newSoporteUrl,
      },
    });

    toast({ title: "Pago actualizado exitosamente" });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!pago) return;
    await deletePago.mutateAsync(pago.id);
    toast({ title: "Pago eliminado exitosamente" });
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  if (!pago) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Pago</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="editValorPago">Valor *</Label>
                <Input
                  id="editValorPago"
                  type="number"
                  value={valorPago}
                  onChange={e => setValorPago(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <DateField
                  value={fechaPago}
                  onChange={setFechaPago}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Método de Pago</Label>
              <Select value={metodoPago} onValueChange={(v) => setMetodoPago(v as MetodoPago)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(METODO_PAGO_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Soporte de pago */}
            <div className="space-y-1.5">
              <Label>Soporte de Pago</Label>
              {!archivo && soporteUrl ? (
                <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-muted/20 min-w-0 overflow-hidden">
                  <span className="text-sm flex-1 truncate min-w-0">Comprobante adjunto</span>
                  <Button variant="ghost" size="sm" className="gap-1.5 h-7 shrink-0" onClick={() => setShowPreview(true)}>
                    <Eye className="h-3.5 w-3.5" />
                    Ver
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-destructive shrink-0" onClick={() => setSoporteUrl(undefined)}>
                    Quitar
                  </Button>
                </div>
              ) : (
                <FileDropZone
                  accept=".pdf,.png,.jpg,.jpeg"
                  onFile={(f) => { setArchivo(f); setSoporteUrl(URL.createObjectURL(f)); }}
                  file={archivo}
                  onClear={() => { setArchivo(null); setSoporteUrl(undefined); }}
                  label="Arrastra el comprobante aquí o haz clic para seleccionar"
                  hint="PDF, PNG, JPG"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editObsv">Observaciones</Label>
              <Textarea
                id="editObsv"
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                rows={2}
              />
            </div>
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
              <Button onClick={handleSubmit} disabled={updatePago.isPending}>
                {updatePago.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Eliminar Pago"
        description={`¿Está seguro de eliminar este pago de ${formatCurrency(pago.valorPago)}? Se recalcularán los saldos automáticamente. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />
      <ArchivoPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        url={soporteUrl || null}
        nombre="Comprobante de pago"
      />
    </>
  );
}
