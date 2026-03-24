import { AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ConsentimientoData {
  consentimientoSalud: boolean;
  restriccionMedica: boolean;
  restriccionMedicaDetalle?: string;
  alergias: boolean;
  alergiasDetalle?: string;
  consumoMedicamentos: boolean;
  consumoMedicamentosDetalle?: string;
  embarazo?: boolean;
  nivelLectoescritura: boolean;
}

interface ConsentimientoSaludProps {
  data: ConsentimientoData;
  onChange: (field: string, value: unknown) => void;
  genero?: 'M' | 'F';
  readOnly?: boolean;
}

function ConsentRow({
  label,
  checked,
  onCheckedChange,
  detailValue,
  detailPlaceholder,
  onDetailChange,
  readOnly,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  detailValue?: string;
  detailPlaceholder?: string;
  onDetailChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <Label className="text-sm flex-1">{label}</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{checked ? "Sí" : "No"}</span>
          <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={readOnly} />
        </div>
      </div>
      {checked && onDetailChange && (
        <Input
          value={detailValue || ""}
          onChange={(e) => onDetailChange(e.target.value)}
          placeholder={detailPlaceholder}
          className="h-8 text-sm"
          disabled={readOnly}
        />
      )}
    </div>
  );
}

export function ConsentimientoSalud({ data, onChange, genero, readOnly }: ConsentimientoSaludProps) {
  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-xs">Confirme cada pregunta directamente con el estudiante antes de continuar.</p>
        </div>
      )}

      <div className="space-y-3">
        <ConsentRow
          label="¿Presenta alguna restricción médica?"
          checked={data.restriccionMedica}
          onCheckedChange={(v) => onChange("restriccionMedica", v)}
          detailValue={data.restriccionMedicaDetalle}
          detailPlaceholder="Especifique la restricción..."
          onDetailChange={(v) => onChange("restriccionMedicaDetalle", v)}
          readOnly={readOnly}
        />

        <ConsentRow
          label="¿Tiene alergias conocidas?"
          checked={data.alergias}
          onCheckedChange={(v) => onChange("alergias", v)}
          detailValue={data.alergiasDetalle}
          detailPlaceholder="Especifique las alergias..."
          onDetailChange={(v) => onChange("alergiasDetalle", v)}
          readOnly={readOnly}
        />

        <ConsentRow
          label="¿Consume medicamentos actualmente?"
          checked={data.consumoMedicamentos}
          onCheckedChange={(v) => onChange("consumoMedicamentos", v)}
          detailValue={data.consumoMedicamentosDetalle}
          detailPlaceholder="Especifique los medicamentos..."
          onDetailChange={(v) => onChange("consumoMedicamentosDetalle", v)}
          readOnly={readOnly}
        />

        {genero === 'M' && (
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm flex-1">A la fecha, ¿usted considera que se encuentra en estado de embarazo?</Label>
            <span className="text-sm text-muted-foreground font-medium">No aplica</span>
          </div>
        )}

        {genero === 'F' && (
          <ConsentRow
            label="A la fecha, ¿usted considera que se encuentra en estado de embarazo?"
            checked={data.embarazo || false}
            onCheckedChange={(v) => onChange("embarazo", v)}
            readOnly={readOnly}
          />
        )}

        <ConsentRow
          label="¿Sabe leer y escribir?"
          checked={data.nivelLectoescritura}
          onCheckedChange={(v) => onChange("nivelLectoescritura", v)}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
