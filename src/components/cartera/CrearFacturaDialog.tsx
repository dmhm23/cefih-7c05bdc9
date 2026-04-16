import { useState, useMemo, useEffect } from "react";
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { FileDropZone } from "@/components/shared/FileDropZone";
import { DateField } from "@/components/shared/DateField";
import { useCreateFactura } from "@/hooks/useCartera";
import { Matricula } from "@/types/matricula";
import { Persona } from "@/types/persona";
import { Curso } from "@/types/curso";
import { useToast } from "@/hooks/use-toast";
import { todayLocalString } from "@/utils/dateUtils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grupoCarteraId: string;
  matriculas: Matricula[];
  personas: Persona[];
  cursos: Curso[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(v);

export function CrearFacturaDialog({ open, onOpenChange, grupoCarteraId, matriculas, personas, cursos }: Props) {
  const { toast } = useToast();
  const createFactura = useCreateFactura();

  const [numeroFactura, setNumeroFactura] = useState("");
  const [fechaEmision, setFechaEmision] = useState(() => todayLocalString());
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [totalManualNum, setTotalManualNum] = useState<number | undefined>(undefined);
  const [totalEditedManually, setTotalEditedManually] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vincularMatriculas, setVincularMatriculas] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const getPersona = (personaId: string) => personas.find(p => p.id === personaId);
  const getCurso = (cursoId: string) => cursos.find(c => c.id === cursoId);

  const subtotal = useMemo(
    () => matriculas.filter(m => selectedIds.includes(m.id)).reduce((s, m) => s + (m.valorCupo || 0), 0),
    [matriculas, selectedIds]
  );

  // Auto-fill total when selection changes (unless manually edited)
  useEffect(() => {
    if (vincularMatriculas && !totalEditedManually && selectedIds.length > 0) {
      setTotalManualNum(subtotal);
    }
  }, [subtotal, vincularMatriculas, selectedIds, totalEditedManually]);

  const toggleMatricula = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleTotalChange = (value: number | undefined) => {
    setTotalManualNum(value);
    setTotalEditedManually(true);
  };

  const handleSubmit = async () => {
    if (!numeroFactura || !fechaVencimiento || !totalManualNum) {
      toast({ title: "Complete los campos requeridos", variant: "destructive" });
      return;
    }

    await createFactura.mutateAsync({
      grupoCarteraId,
      numeroFactura,
      fechaEmision,
      fechaVencimiento,
      matriculaIds: vincularMatriculas ? selectedIds : [],
      total: totalManualNum,
      archivoFactura: archivo ? URL.createObjectURL(archivo) : undefined,
    });

    toast({ title: "Factura registrada exitosamente" });
    onOpenChange(false);
    // Reset
    setSelectedIds([]);
    setNumeroFactura("");
    setFechaVencimiento("");
    setTotalManualNum(undefined);
    setTotalEditedManually(false);
    setArchivo(null);
    setVincularMatriculas(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Factura</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campos principales */}
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
              <Label htmlFor="totalFactura">Total *</Label>
              <CurrencyInput
                id="totalFactura"
                value={totalManualNum}
                onChange={(v) => handleTotalChange(v)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Fecha Emisión</Label>
              <DateField
                value={fechaEmision}
                onChange={setFechaEmision}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha Vencimiento *</Label>
              <DateField
                value={fechaVencimiento}
                onChange={setFechaVencimiento}
                placeholder="Seleccionar vencimiento"
              />
            </div>
          </div>

          {/* Archivo de factura */}
          <div className="space-y-1.5">
            <Label>Archivo de Factura (PDF)</Label>
            <FileDropZone
              accept=".pdf,.png,.jpg,.jpeg"
              onFile={setArchivo}
              file={archivo}
              onClear={() => setArchivo(null)}
              label="Arrastra la factura aquí o haz clic para seleccionar"
              hint="PDF, PNG, JPG"
            />
          </div>

          {/* Toggle vincular matrículas */}
          <div className="flex items-center gap-3 pt-1">
            <Switch
              checked={vincularMatriculas}
              onCheckedChange={(checked) => {
                setVincularMatriculas(checked);
                if (!checked) {
                  setSelectedIds([]);
                  if (!totalEditedManually) setTotalManualNum(undefined);
                }
              }}
            />
            <Label className="text-sm cursor-pointer" onClick={() => setVincularMatriculas(!vincularMatriculas)}>
              Vincular matrículas específicas a esta factura
            </Label>
          </div>

          {/* Selección de matrículas (condicional) */}
          {vincularMatriculas && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Matrículas a vincular
              </Label>
              <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                {matriculas.map(m => {
                  const persona = getPersona(m.personaId);
                  const curso = getCurso(m.cursoId);
                  const nombreCompleto = persona
                    ? `${persona.nombres} ${persona.apellidos}`
                    : m.personaId;
                  return (
                    <label
                      key={m.id}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/30"
                    >
                      <Checkbox
                        checked={selectedIds.includes(m.id)}
                        onCheckedChange={() => toggleMatricula(m.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{nombreCompleto}</span>
                        {curso && (
                          <span className="text-xs text-muted-foreground ml-2 truncate">
                            {curso.nombre}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(m.valorCupo || 0)}
                      </span>
                    </label>
                  );
                })}
                {matriculas.length === 0 && (
                  <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                    No hay matrículas en este grupo.
                  </div>
                )}
              </div>
              {selectedIds.length > 0 && (
                <div className="text-xs text-muted-foreground text-right">
                  {selectedIds.length} seleccionada(s) — Subtotal: {formatCurrency(subtotal)}
                </div>
              )}
            </div>
          )}
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
