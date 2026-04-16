import { useState, useEffect } from "react";
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { useNavigate } from "react-router-dom";
import { User, UserCog } from "lucide-react";
import { DetailSheet, DetailSection } from "@/components/shared/DetailSheet";
import { EditableField } from "@/components/shared/EditableField";
import { AdjuntosPersonal } from "@/components/personal/AdjuntosPersonal";
import { FirmaPersonal } from "@/components/personal/FirmaPersonal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useUpdatePersonal,
  useCargos,
  usePersonal,
  useUpdateFirma,
  useDeleteFirma,
  useAddAdjunto,
  useDeleteAdjunto,
} from "@/hooks/usePersonal";
import { Personal, PersonalFormData } from "@/types/personal";

interface PersonalDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personal: Personal | null;
  currentIndex: number;
  totalCount: number;
  onNavigate: (direction: "prev" | "next") => void;
}

export function PersonalDetailSheet({
  open,
  onOpenChange,
  personal,
  currentIndex,
  totalCount,
  onNavigate,
}: PersonalDetailSheetProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const { data: fullPersonal } = usePersonal(personal?.id || "");
  const displayPersonal = fullPersonal || personal;
  const updatePersonal = useUpdatePersonal();
  const { data: cargos = [] } = useCargos();
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

  if (!personal || !displayPersonal) return null;

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
      logActivity({ action: "editar", module: "personal", description: `Editó perfil ${getValue("nombres")} ${getValue("apellidos")} desde panel lateral`, entityType: "personal", entityId: personal.id, metadata: { campos_modificados: Object.keys(formData) } });
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

  const handleClose = (newOpen: boolean) => {
    if (!newOpen && isDirty) handleCancel();
    onOpenChange(newOpen);
  };

  const getValue = <K extends keyof Personal>(field: K): Personal[K] => {
    return (formData[field as keyof PersonalFormData] as Personal[K]) ?? displayPersonal[field];
  };

  const fullName = `${getValue("nombres")} ${getValue("apellidos")}`;
  const cargoOptions = cargos.map(c => ({ value: c.id, label: c.nombre }));

  const handleFullScreen = () => {
    onOpenChange(false);
    navigate(`/gestion-personal/${personal.id}`);
  };

  // Firma handlers
  const handleGuardarFirma = (firmaBase64: string) => {
    updateFirma.mutate(
      { id: personal.id, firmaBase64 },
      { onSuccess: () => {
        toast({ title: "Firma guardada" });
        logActivity({ action: "subir", module: "personal", description: `Guardó firma digital de ${displayPersonal.nombres} ${displayPersonal.apellidos}`, entityType: "personal", entityId: personal.id });
      } }
    );
  };

  const handleEliminarFirma = () => {
    deleteFirma.mutate(personal.id, {
      onSuccess: () => {
        toast({ title: "Firma eliminada" });
        logActivity({ action: "eliminar", module: "personal", description: `Eliminó firma digital de ${displayPersonal.nombres} ${displayPersonal.apellidos}`, entityType: "personal", entityId: personal.id });
      },
    });
  };

  // Adjuntos handlers
  const handleUploadAdjuntos = async (files: File[]) => {
    try {
      await Promise.all(files.map(file => addAdjunto.mutateAsync({ personalId: personal.id, file })));
      toast({ title: files.length === 1 ? "Archivo adjuntado" : `${files.length} archivos adjuntados` });
      logActivity({ action: "subir", module: "personal", description: `Subió ${files.length} adjunto(s) a perfil ${displayPersonal.nombres} ${displayPersonal.apellidos}`, entityType: "personal", entityId: personal.id, metadata: { archivos: files.map(f => f.name) } });
    } catch {
      toast({ title: "Error al cargar archivo(s)", variant: "destructive" });
    }
  };

  const handleDeleteAdjunto = (adjuntoId: string) => {
    deleteAdjunto.mutate(
      { personalId: personal.id, adjuntoId },
      { onSuccess: () => {
        toast({ title: "Archivo eliminado" });
        logActivity({ action: "eliminar", module: "personal", description: `Eliminó adjunto de perfil ${displayPersonal.nombres} ${displayPersonal.apellidos}`, entityType: "personal", entityId: personal.id, metadata: { adjunto_id: adjuntoId } });
      } }
    );
  };

  return (
    <DetailSheet
      open={open}
      onOpenChange={handleClose}
      title={fullName}
      subtitle={getValue("cargoNombre")}
      currentIndex={currentIndex}
      totalCount={totalCount}
      onNavigate={onNavigate}
      onFullScreen={handleFullScreen}
      countLabel="perfiles"
      footer={
        isDirty ? (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updatePersonal.isPending}>
              {updatePersonal.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <DetailSection title="Datos del Perfil">
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
        </DetailSection>

        {/* Documentos Adjuntos */}
        <DetailSection title="Documentos Adjuntos">
          <AdjuntosPersonal
            adjuntos={displayPersonal.adjuntos || []}
            onUpload={handleUploadAdjuntos}
            onDelete={handleDeleteAdjunto}
            isUploading={addAdjunto.isPending}
            isDeleting={deleteAdjunto.isPending}
          />
        </DetailSection>

        {/* Firma Digital */}
        <DetailSection title="Firma Digital">
          <FirmaPersonal
            firmaExistente={displayPersonal.firmaBase64}
            onGuardarFirma={handleGuardarFirma}
            onEliminarFirma={handleEliminarFirma}
            isPending={updateFirma.isPending || deleteFirma.isPending}
          />
        </DetailSection>
      </div>
    </DetailSheet>
  );
}
