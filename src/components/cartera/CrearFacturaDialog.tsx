import { useState, useMemo, useRef } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateFactura } from "@/hooks/useCartera";
import { Matricula } from "@/types/matricula";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grupoCarteraId: string;
  matriculas: Matricula[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(v);

export function CrearFacturaDialog({ open, onOpenChange, grupoCarteraId, matriculas }: Props) {
  const { toast } = useToast();
  const createFactura = useCreateFactura();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [numeroFactura, setNumeroFactura] = useState("");
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split("T")[0]);
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);

  const subtotal = useMemo(
    () => matriculas.filter(m => selectedIds.includes(m.id)).reduce((s, m) => s + (m.valorCupo || 0), 0),
    [matriculas, selectedIds]
  );

  const toggleMatricula = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!numeroFactura || selectedIds.length === 0 || !fechaVencimiento) {
      toast({ title: "Complete los campos requeridos", variant: "destructive" });
      return;
    }

    await createFactura.mutateAsync({
      grupoCarteraId,
      numeroFactura,
      fechaEmision,
      fechaVencimiento,
      matriculaIds: selectedIds,
      total: subtotal,
    });

    toast({ title: "Factura registrada exitosamente" });
    onOpenChange(false);
    setSelectedIds([]);
    setNumeroFactura("");
    setFechaVencimiento("");
    setArchivo(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Factura</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selección de matrículas */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Matrículas a facturar
            </Label>
            <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
              {matriculas.map(m => (
                <label
                  key={m.id}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/30"
                >
                  <Checkbox
                    checked={selectedIds.includes(m.id)}
                    onCheckedChange={() => toggleMatricula(m.id)}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{m.id}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {m.empresaNombre || "Independiente"}
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatCurrency(m.valorCupo || 0)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Campos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="numFactura">No. Factura *</Label>
              <Input
                id="numFactura"
                value={numeroFactura}
                onChange={e => setNumeroFactura(e.target.value)}
                placeholder="FAC-2024-XXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Subtotal</Label>
              <div className="h-9 flex items-center px-3 border rounded-md bg-muted/30 text-sm font-medium">
                {formatCurrency(subtotal)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fechaEmision">Fecha Emisión</Label>
              <Input
                id="fechaEmision"
                type="date"
                value={fechaEmision}
                onChange={e => setFechaEmision(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fechaVenc">Fecha Vencimiento *</Label>
              <Input
                id="fechaVenc"
                type="date"
                value={fechaVencimiento}
                onChange={e => setFechaVencimiento(e.target.value)}
              />
            </div>
          </div>

          {/* Archivo de factura */}
          <div className="space-y-1.5">
            <Label>Archivo de Factura (PDF)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) setArchivo(file);
              }}
            />
            {archivo ? (
              <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-muted/20">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm flex-1 truncate">{archivo.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(archivo.size / 1024).toFixed(0)} KB
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setArchivo(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Cargar archivo
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={createFactura.isPending}>
            {createFactura.isPending ? "Registrando..." : "Registrar Factura"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
