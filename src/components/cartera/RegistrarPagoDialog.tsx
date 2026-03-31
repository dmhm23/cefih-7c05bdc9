import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileDropZone } from "@/components/shared/FileDropZone";
import { DateField } from "@/components/shared/DateField";
import { useRegistrarPagoCartera, usePagosByFactura } from "@/hooks/useCartera";
import { Factura, MetodoPago, METODO_PAGO_LABELS } from "@/types/cartera";
import { useToast } from "@/hooks/use-toast";
import { todayLocalString } from "@/utils/dateUtils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factura: Factura;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(v);

export function RegistrarPagoDialog({ open, onOpenChange, factura }: Props) {
  const { toast } = useToast();
  const registrarPago = useRegistrarPagoCartera();
  const { data: pagosExistentes = [] } = usePagosByFactura(factura.id);

  const [valorPago, setValorPago] = useState("");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("transferencia_bancaria");
  const [metodoOtro, setMetodoOtro] = useState("");
  const [fechaPago, setFechaPago] = useState(() => todayLocalString());
  const [observaciones, setObservaciones] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);

  const totalPagado = useMemo(() => pagosExistentes.reduce((s, p) => s + p.valorPago, 0), [pagosExistentes]);
  const saldoPendiente = factura.total - totalPagado;

  const handleSubmit = async () => {
    const valor = parseFloat(valorPago);
    if (!valorPago || valor <= 0) {
      toast({ title: "Ingrese un valor válido", variant: "destructive" });
      return;
    }
    if (valor > saldoPendiente) {
      toast({ title: `El valor excede el saldo pendiente (${formatCurrency(saldoPendiente)})`, variant: "destructive" });
      return;
    }
    if (!archivo) {
      toast({ title: "Debe adjuntar el soporte de pago (comprobante)", variant: "destructive" });
      return;
    }
    if (metodoPago === "otro" && !metodoOtro.trim()) {
      toast({ title: "Especifique el método de pago", variant: "destructive" });
      return;
    }

    const obsConMetodo = metodoPago === "otro"
      ? [metodoOtro.trim(), observaciones].filter(Boolean).join(" — ")
      : observaciones || undefined;

    await registrarPago.mutateAsync({
      facturaId: factura.id,
      fechaPago,
      valorPago: valor,
      metodoPago,
      observaciones: obsConMetodo,
      soportePago: URL.createObjectURL(archivo),
    });

    toast({ title: "Pago registrado exitosamente" });
    onOpenChange(false);
    setValorPago("");
    setMetodoOtro("");
    setObservaciones("");
    setArchivo(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pago — {factura.numeroFactura}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumen factura */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total factura</span>
              <span className="font-medium">{formatCurrency(factura.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pagado</span>
              <span className="font-medium text-emerald-600">{formatCurrency(totalPagado)}</span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span className="font-medium">Saldo pendiente</span>
              <span className="font-semibold text-destructive">{formatCurrency(saldoPendiente)}</span>
            </div>
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
                max={saldoPendiente}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fechaPago">Fecha</Label>
              <DateField
                id="fechaPago"
                value={fechaPago}
                onChange={setFechaPago}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Método de Pago</Label>
            <Select value={metodoPago} onValueChange={(v) => { setMetodoPago(v as MetodoPago); if (v !== "otro") setMetodoOtro(""); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(METODO_PAGO_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {metodoPago === "otro" && (
              <Input
                placeholder="Especifique el método de pago..."
                value={metodoOtro}
                onChange={e => setMetodoOtro(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Soporte de Pago (comprobante) *</Label>
            <FileDropZone
              accept=".pdf,.png,.jpg,.jpeg"
              onFile={setArchivo}
              file={archivo}
              onClear={() => setArchivo(null)}
              label="Arrastra el comprobante aquí o haz clic para seleccionar"
              hint="PDF, PNG, JPG"
            />
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
