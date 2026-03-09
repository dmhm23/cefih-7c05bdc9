import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUpdatePago } from "@/hooks/useCartera";
import { RegistroPago, MetodoPago, METODO_PAGO_LABELS } from "@/types/cartera";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pago: RegistroPago | null;
}

export function EditarPagoDialog({ open, onOpenChange, pago }: Props) {
  const { toast } = useToast();
  const updatePago = useUpdatePago();

  const [fechaPago, setFechaPago] = useState("");
  const [valorPago, setValorPago] = useState("");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("transferencia");
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    if (pago) {
      setFechaPago(pago.fechaPago);
      setValorPago(String(pago.valorPago));
      setMetodoPago(pago.metodoPago);
      setObservaciones(pago.observaciones || "");
    }
  }, [pago]);

  const handleSubmit = async () => {
    if (!pago || !valorPago || parseFloat(valorPago) <= 0) {
      toast({ title: "Complete los campos requeridos", variant: "destructive" });
      return;
    }

    await updatePago.mutateAsync({
      id: pago.id,
      data: {
        fechaPago,
        valorPago: parseFloat(valorPago),
        metodoPago,
        observaciones: observaciones || undefined,
      },
    });

    toast({ title: "Pago actualizado exitosamente" });
    onOpenChange(false);
  };

  if (!pago) return null;

  return (
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
              <Label htmlFor="editFechaPago">Fecha</Label>
              <Input
                id="editFechaPago"
                type="date"
                value={fechaPago}
                onChange={e => setFechaPago(e.target.value)}
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={updatePago.isPending}>
            {updatePago.isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
