import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateFactura } from "@/hooks/useCartera";
import { Factura } from "@/types/cartera";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factura: Factura | null;
}

export function EditarFacturaDialog({ open, onOpenChange, factura }: Props) {
  const { toast } = useToast();
  const updateFactura = useUpdateFactura();

  const [numeroFactura, setNumeroFactura] = useState("");
  const [fechaEmision, setFechaEmision] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [total, setTotal] = useState("");

  useEffect(() => {
    if (factura) {
      setNumeroFactura(factura.numeroFactura);
      setFechaEmision(factura.fechaEmision);
      setFechaVencimiento(factura.fechaVencimiento);
      setTotal(String(factura.total));
    }
  }, [factura]);

  const handleSubmit = async () => {
    if (!factura || !numeroFactura || !fechaVencimiento || !total) {
      toast({ title: "Complete los campos requeridos", variant: "destructive" });
      return;
    }

    await updateFactura.mutateAsync({
      id: factura.id,
      data: {
        numeroFactura,
        fechaEmision,
        fechaVencimiento,
        total: parseFloat(total),
      },
    });

    toast({ title: "Factura actualizada exitosamente" });
    onOpenChange(false);
  };

  if (!factura) return null;

  return (
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={updateFactura.isPending}>
            {updateFactura.isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
