import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRegistrarPagoCartera } from "@/hooks/useCartera";
import { Factura, MetodoPago, METODO_PAGO_LABELS, ESTADO_FACTURA_LABELS } from "@/types/cartera";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facturas: Factura[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(v);

export function RegistrarPagoDialog({ open, onOpenChange, facturas }: Props) {
  const { toast } = useToast();
  const registrarPago = useRegistrarPagoCartera();

  const [facturaId, setFacturaId] = useState("");
  const [valorPago, setValorPago] = useState("");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("transferencia");
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split("T")[0]);
  const [observaciones, setObservaciones] = useState("");

  const facturasPendientes = facturas.filter(f => f.estado !== "pagada");
  const selectedFactura = facturas.find(f => f.id === facturaId);

  const handleSubmit = async () => {
    if (!facturaId || !valorPago || parseFloat(valorPago) <= 0) {
      toast({ title: "Complete los campos requeridos", variant: "destructive" });
      return;
    }

    await registrarPago.mutateAsync({
      facturaId,
      fechaPago,
      valorPago: parseFloat(valorPago),
      metodoPago,
      observaciones: observaciones || undefined,
    });

    toast({ title: "Pago registrado exitosamente" });
    onOpenChange(false);
    setFacturaId("");
    setValorPago("");
    setObservaciones("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Factura *</Label>
            <Select value={facturaId} onValueChange={setFacturaId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar factura" />
              </SelectTrigger>
              <SelectContent>
                {facturasPendientes.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.numeroFactura} — {formatCurrency(f.total)} ({ESTADO_FACTURA_LABELS[f.estado]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="valorPago">Valor *</Label>
              <Input
                id="valorPago"
                type="number"
                value={valorPago}
                onChange={e => setValorPago(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fechaPago">Fecha</Label>
              <Input
                id="fechaPago"
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
            <Label htmlFor="obsv">Observaciones</Label>
            <Textarea
              id="obsv"
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Notas del pago..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={registrarPago.isPending}>
            {registrarPago.isPending ? "Registrando..." : "Registrar Pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
