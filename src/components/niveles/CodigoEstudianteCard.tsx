import { useState, useMemo, useEffect } from "react";
import { Hash, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { useUpdateNivelFormacion } from "@/hooks/useNivelesFormacion";
import {
  ConfiguracionCodigoEstudiante,
  DEFAULT_CONFIG_CODIGO,
} from "@/types/nivelFormacion";
import { generarPreviewCodigo } from "@/utils/codigoEstudiante";

interface Props {
  nivelId: string;
  config?: ConfiguracionCodigoEstudiante;
}

export function CodigoEstudianteCard({ nivelId, config }: Props) {
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const updateNivel = useUpdateNivelFormacion();

  const initial = config ?? DEFAULT_CONFIG_CODIGO;
  const [draft, setDraft] = useState<ConfiguracionCodigoEstudiante>(initial);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const incoming = config ?? DEFAULT_CONFIG_CODIGO;
    setDraft(incoming);
    setIsDirty(false);
  }, [config]);

  const patch = (partial: Partial<ConfiguracionCodigoEstudiante>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
    setIsDirty(true);
  };

  const preview = useMemo(() => generarPreviewCodigo(draft), [draft]);

  const isValid =
    draft.prefijoCodigo.trim().length > 0 &&
    draft.codigoTipoFormacion.trim().length > 0 &&
    draft.separadorCodigo.trim().length > 0 &&
    draft.longitudConsecutivoEstudiante >= 2;

  const handleSave = async () => {
    if (!isValid) return;
    try {
      await updateNivel.mutateAsync({
        id: nivelId,
        data: { configuracionCodigoEstudiante: draft },
      });
      toast({ title: "Configuración de código guardada" });
      logActivity({ action: "editar", module: "niveles", description: `Actualizó configuración de código de estudiante`, entityType: "nivel_formacion", entityId: nivelId, metadata: { prefijo: draft.prefijoCodigo, tipo_formacion: draft.codigoTipoFormacion } });
      setIsDirty(false);
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    }
  };

  const handleCancel = () => {
    setDraft(config ?? DEFAULT_CONFIG_CODIGO);
    setIsDirty(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Código de Estudiante
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="codigo-activo" className="text-xs text-muted-foreground">
              {draft.activo ? "Activo" : "Inactivo"}
            </Label>
            <Switch
              id="codigo-activo"
              checked={draft.activo}
              onCheckedChange={(v) => patch({ activo: v })}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {draft.activo ? (
          <>
            {/* Preview */}
            <div className="rounded-md border bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Vista previa</p>
              <p className="font-mono text-lg font-semibold tracking-wider">
                {preview}
              </p>
            </div>

            {/* Inputs row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Prefijo *</Label>
                <Input
                  value={draft.prefijoCodigo}
                  onChange={(e) => patch({ prefijoCodigo: e.target.value.toUpperCase() })}
                  placeholder="FIH"
                  className="h-8 text-sm font-mono"
                  maxLength={6}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo formación *</Label>
                <Input
                  value={draft.codigoTipoFormacion}
                  onChange={(e) => patch({ codigoTipoFormacion: e.target.value.toUpperCase() })}
                  placeholder="R"
                  className="h-8 text-sm font-mono"
                  maxLength={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Separador *</Label>
                <Input
                  value={draft.separadorCodigo}
                  onChange={(e) => patch({ separadorCodigo: e.target.value })}
                  placeholder="-"
                  className="h-8 text-sm font-mono text-center"
                  maxLength={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Dígitos consecutivo</Label>
                <Input
                  type="number"
                  min={2}
                  max={8}
                  value={draft.longitudConsecutivoEstudiante}
                  onChange={(e) =>
                    patch({ longitudConsecutivoEstudiante: Math.max(2, parseInt(e.target.value) || 2) })
                  }
                  className="h-8 text-sm font-mono"
                />
              </div>
            </div>


            {/* Help */}
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <strong>Prefijo</strong> y <strong>Tipo formación</strong> son fijos.{" "}
              <strong>Año</strong>, <strong>Mes</strong> y <strong>Consecutivo curso</strong> se
              toman automáticamente del curso. El <strong>consecutivo estudiante</strong> se
              asigna en orden de inscripción.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Activa la configuración para definir la regla del código de estudiante.
          </p>
        )}

        {/* Save bar */}
        {isDirty && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={updateNivel.isPending}>
              <X className="h-3.5 w-3.5 mr-1" />
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isValid || updateNivel.isPending}
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {updateNivel.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
