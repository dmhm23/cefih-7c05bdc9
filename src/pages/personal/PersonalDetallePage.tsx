import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { usePersonal } from "@/hooks/usePersonal";
import { EditableField } from "@/components/shared/EditableField";
import { useUpdatePersonal, useCargos } from "@/hooks/usePersonal";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { PersonalFormData } from "@/types/personal";
import { User } from "lucide-react";

export default function PersonalDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: personal, isLoading } = usePersonal(id || "");
  const { data: cargos = [] } = useCargos();
  const updatePersonal = useUpdatePersonal();

  const [formData, setFormData] = useState<Partial<PersonalFormData>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFormData({});
    setIsDirty(false);
  }, [personal?.id]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!personal) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Perfil no encontrado</p>
        <Button variant="link" onClick={() => navigate("/gestion-personal")}>
          Volver al listado
        </Button>
      </div>
    );
  }

  const handleFieldChange = (field: keyof PersonalFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      // If cargoId changed, also update cargoNombre
      const data = { ...formData };
      if (data.cargoId) {
        const cargo = cargos.find(c => c.id === data.cargoId);
        if (cargo) data.cargoNombre = cargo.nombre;
      }
      await updatePersonal.mutateAsync({ id: personal.id, data });
      toast({ title: "Cambios guardados correctamente" });
      setFormData({});
      setIsDirty(false);
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    }
  };

  const handleCancel = () => {
    setFormData({});
    setIsDirty(false);
  };

  const getValue = <K extends keyof typeof personal>(field: K) => {
    return (formData[field as keyof PersonalFormData] as (typeof personal)[K]) ?? personal[field];
  };

  const cargoOptions = cargos.map(c => ({ value: c.id, label: c.nombre }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/gestion-personal")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold">{getValue("nombres")} {getValue("apellidos")}</h1>
          <Badge variant="secondary">{getValue("cargoNombre")}</Badge>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="border rounded-lg p-4 shadow-sm space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Datos del Perfil
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <EditableField
              label="Nombres"
              value={getValue("nombres")}
              onChange={(v) => handleFieldChange("nombres", v)}
              icon={User}
            />
            <EditableField
              label="Apellidos"
              value={getValue("apellidos")}
              onChange={(v) => handleFieldChange("apellidos", v)}
              icon={User}
            />
            <EditableField
              label="Cargo"
              value={getValue("cargoId")}
              displayValue={getValue("cargoNombre")}
              onChange={(v) => handleFieldChange("cargoId", v)}
              type="select"
              options={cargoOptions}
              icon={UserCog}
              badge
            />
          </div>
        </div>
      </div>

      {isDirty && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-background border rounded-lg shadow-lg p-3">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updatePersonal.isPending}>
            {updatePersonal.isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      )}
    </div>
  );
}
