import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import { ARL_OPTIONS, SECTORES_ECONOMICOS } from "@/data/formOptions";

export interface SincronizarEmpresaSuggestion {
  empresaId: string;
  empresaNombre: string;
  arl?: string;          // valor a propagar (solo si la empresa no lo tenía)
  sectorEconomico?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion: SincronizarEmpresaSuggestion | null;
  onConfirm: (selected: { arl?: string; sectorEconomico?: string }) => void;
  isPending?: boolean;
}

const labelArl = (v: string) => ARL_OPTIONS.find(o => o.value === v)?.label || v;
const labelSector = (v: string) => SECTORES_ECONOMICOS.find(o => o.value === v)?.label || v;

export function SincronizarEmpresaDialog({
  open,
  onOpenChange,
  suggestion,
  onConfirm,
  isPending = false,
}: Props) {
  const [syncArl, setSyncArl] = useState(true);
  const [syncSector, setSyncSector] = useState(true);

  useEffect(() => {
    setSyncArl(!!suggestion?.arl);
    setSyncSector(!!suggestion?.sectorEconomico);
  }, [suggestion?.empresaId, suggestion?.arl, suggestion?.sectorEconomico]);

  if (!suggestion) return null;

  const hasArl = !!suggestion.arl;
  const hasSector = !!suggestion.sectorEconomico;
  const canConfirm = (hasArl && syncArl) || (hasSector && syncSector);

  const handleConfirm = () => {
    onConfirm({
      arl: hasArl && syncArl ? suggestion.arl : undefined,
      sectorEconomico: hasSector && syncSector ? suggestion.sectorEconomico : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Completar datos de la empresa
          </DialogTitle>
          <DialogDescription>
            La empresa <span className="font-medium text-foreground">{suggestion.empresaNombre}</span> no tiene
            registrada esta información. ¿Quieres guardarla también en la empresa para futuras matrículas?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {hasArl && (
            <div className="flex items-start gap-3 rounded-md border p-3">
              <Checkbox
                id="sync-arl"
                checked={syncArl}
                onCheckedChange={(v) => setSyncArl(v === true)}
                className="mt-0.5"
              />
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="sync-arl" className="cursor-pointer text-sm font-medium">
                  ARL
                </Label>
                <p className="text-xs text-muted-foreground">
                  Guardar <span className="font-medium text-foreground">{labelArl(suggestion.arl!)}</span> en la empresa.
                </p>
              </div>
            </div>
          )}

          {hasSector && (
            <div className="flex items-start gap-3 rounded-md border p-3">
              <Checkbox
                id="sync-sector"
                checked={syncSector}
                onCheckedChange={(v) => setSyncSector(v === true)}
                className="mt-0.5"
              />
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="sync-sector" className="cursor-pointer text-sm font-medium">
                  Sector económico
                </Label>
                <p className="text-xs text-muted-foreground">
                  Guardar <span className="font-medium text-foreground">{labelSector(suggestion.sectorEconomico!)}</span> en la empresa.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            No, solo matrícula
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm || isPending}>
            {isPending ? "Guardando..." : "Sí, actualizar empresa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
