import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, UserCog, PenTool, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { usePersonal, useUpdatePersonal, useCargos, useUpdateFirma, useDeleteFirma, useAddAdjunto, useDeleteAdjunto } from "@/hooks/usePersonal";
import { EditableField } from "@/components/shared/EditableField";
import { FirmaPersonal } from "@/components/personal/FirmaPersonal";
import { AdjuntosPersonal } from "@/components/personal/AdjuntosPersonal";
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
  const updateFirma = useUpdateFirma();
  const deleteFirma = useDeleteFirma();
  const addAdjunto = useAddAdjunto();
  const deleteAdjunto = useDeleteAdjunto();

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

  const handleSaveFirma = async (firmaBase64: string) => {
    try {
      await updateFirma.mutateAsync({ id: personal.id, firmaBase64 });
      toast({ title: "Firma guardada correctamente" });
    } catch {
      toast({ title: "Error al guardar firma", variant: "destructive" });
    }
  };

  const handleDeleteFirma = async () => {
    try {
      await deleteFirma.mutateAsync(personal.id);
      toast({ title: "Firma eliminada" });
    } catch {
      toast({ title: "Error al eliminar firma", variant: "destructive" });
    }
  };

  const handleUploadAdjunto = async (file: File) => {
    try {
      await addAdjunto.mutateAsync({ personalId: personal.id, file });
      toast({ title: "Archivo cargado correctamente" });
    } catch {
      toast({ title: "Error al cargar archivo", variant: "destructive" });
    }
  };

  const handleDeleteAdjunto = async (adjuntoId: string) => {
    try {
      await deleteAdjunto.mutateAsync({ personalId: personal.id, adjuntoId });
      toast({ title: "Archivo eliminado" });
    } catch {
      toast({ title: "Error al eliminar archivo", variant: "destructive" });
    }
  };

  const getValue = <K extends keyof typeof personal>(field: K) => {
    return (formData[field as keyof PersonalFormData] as (typeof personal)[K]) ?? personal[field];
  };

  const cargoOptions = cargos.map(c => ({ value: c.id, label: c.nombre }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <IconButton tooltip="Volver" onClick={() => navigate("/gestion-personal")}>
          <ArrowLeft className="h-4 w-4" />
        </IconButton>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold">{getValue("nombres")} {getValue("apellidos")}</h1>
          <Badge variant="secondary">{getValue("cargoNombre")}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Profile data */}
        <div className="lg:col-span-2 space-y-4">
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
                label="Rol"
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

          {/* Adjuntos */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <Paperclip className="h-3.5 w-3.5" />
              Documentos Adjuntos
            </h3>
            <AdjuntosPersonal
              adjuntos={personal.adjuntos || []}
              onUpload={handleUploadAdjunto}
              onDelete={handleDeleteAdjunto}
              isUploading={addAdjunto.isPending}
              isDeleting={deleteAdjunto.isPending}
            />
          </div>
        </div>

        {/* Right: Firma */}
        <div className="space-y-4">
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <PenTool className="h-3.5 w-3.5" />
              Firma Digital
            </h3>
            <FirmaPersonal
              firmaExistente={personal.firmaBase64}
              onGuardarFirma={handleSaveFirma}
              onEliminarFirma={handleDeleteFirma}
              isPending={updateFirma.isPending || deleteFirma.isPending}
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
