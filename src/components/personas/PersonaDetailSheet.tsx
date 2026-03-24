import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  User,
  FileText,
  Phone,
  Mail,
  Calendar,
  Droplet,
  GraduationCap,
  Globe,
  UserCircle,
  AlertCircle,
} from "lucide-react";
import { DetailSheet, DetailSection } from "@/components/shared/DetailSheet";
import { EditableField } from "@/components/shared/EditableField";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUpdatePersona } from "@/hooks/usePersonas";
import { useMatriculasByPersona } from "@/hooks/useMatriculas";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { NIVEL_FORMACION_EMPRESA_LABELS } from "@/types/matricula";
import { Persona, PersonaFormData } from "@/types/persona";
import {
  TIPOS_DOCUMENTO,
  GENEROS,
  NIVELES_EDUCATIVOS,
  GRUPOS_SANGUINEOS,
  PAISES,
} from "@/data/formOptions";
import { Separator } from "@/components/ui/separator";

interface PersonaDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona: Persona | null;
  currentIndex: number;
  totalCount: number;
  onNavigate: (direction: "prev" | "next") => void;
}

export function PersonaDetailSheet({
  open,
  onOpenChange,
  persona,
  currentIndex,
  totalCount,
  onNavigate,
}: PersonaDetailSheetProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const updatePersona = useUpdatePersona();
  const { data: matriculas = [] } = useMatriculasByPersona(persona?.id || "");
  const [formData, setFormData] = useState<Partial<PersonaFormData>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Reset form data when persona changes
  useEffect(() => {
    setFormData({});
    setIsDirty(false);
  }, [persona?.id]);

  if (!persona) return null;

  const handleFieldChange = (field: keyof PersonaFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleNestedFieldChange = (
    parent: "contactoEmergencia",
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...persona[parent],
        ...(prev[parent] as object || {}),
        [field]: value,
      },
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      await updatePersona.mutateAsync({
        id: persona.id,
        data: formData,
      });
      toast({ title: "Cambios guardados correctamente" });
      setFormData({});
      setIsDirty(false);
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setFormData({});
    setIsDirty(false);
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen && isDirty) {
      // Could show confirmation dialog here
      handleCancel();
    }
    onOpenChange(newOpen);
  };

  // Helper to get current value (form override or original)
  const getValue = <K extends keyof Persona>(field: K): Persona[K] => {
    return (formData[field as keyof PersonaFormData] as Persona[K]) ?? persona[field];
  };

  const getDisplayLabel = (
    value: string,
    options: readonly { value: string; label: string }[]
  ) => {
    return options.find((o) => o.value === value)?.label || value;
  };

  const fullName = `${getValue("nombres")} ${getValue("apellidos")}`;
  const docInfo = `${getValue("tipoDocumento")}: ${getValue("numeroDocumento")}`;

  const handleFullScreen = () => {
    if (persona) {
      onOpenChange(false);
      navigate(`/personas/${persona.id}`);
    }
  };

  return (
    <DetailSheet
      open={open}
      onOpenChange={handleClose}
      title={fullName}
      subtitle={docInfo}
      currentIndex={currentIndex}
      totalCount={totalCount}
      onNavigate={onNavigate}
      onFullScreen={handleFullScreen}
      countLabel="personas"
      footer={
        isDirty ? (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updatePersona.isPending}>
              {updatePersona.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* Datos Personales */}
        <DetailSection title="Datos Personales">
          <div className="grid grid-cols-2 gap-4">
            <EditableField
              label="Tipo de Documento"
              value={getValue("tipoDocumento")}
              displayValue={getDisplayLabel(getValue("tipoDocumento"), TIPOS_DOCUMENTO)}
              onChange={(v) => handleFieldChange("tipoDocumento", v)}
              type="select"
              options={[...TIPOS_DOCUMENTO]}
              icon={FileText}
              badge
            />
            <EditableField
              label="Número de Documento"
              value={getValue("numeroDocumento")}
              onChange={(v) => handleFieldChange("numeroDocumento", v)}
              icon={FileText}
            />
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
              label="Género"
              value={getValue("genero")}
              displayValue={getDisplayLabel(getValue("genero"), GENEROS)}
              onChange={(v) => handleFieldChange("genero", v)}
              type="select"
              options={[...GENEROS]}
              icon={UserCircle}
              badge
            />
            <EditableField
              label="País de Nacimiento"
              value={getValue("paisNacimiento")}
              displayValue={getDisplayLabel(getValue("paisNacimiento"), PAISES)}
              onChange={(v) => handleFieldChange("paisNacimiento", v)}
              type="select"
              options={[...PAISES]}
              icon={Globe}
            />
            <EditableField
              label="Fecha de Nacimiento"
              value={getValue("fechaNacimiento")}
              onChange={(v) => handleFieldChange("fechaNacimiento", v)}
              type="date"
              icon={Calendar}
            />
            <EditableField
              label="Grupo Sanguíneo"
              value={getValue("rh")}
              displayValue={getDisplayLabel(getValue("rh"), GRUPOS_SANGUINEOS)}
              onChange={(v) => handleFieldChange("rh", v)}
              type="select"
              options={[...GRUPOS_SANGUINEOS]}
              icon={Droplet}
              badge
              badgeVariant="outline"
            />
            <EditableField
              label="Nivel Educativo"
              value={getValue("nivelEducativo")}
              displayValue={getDisplayLabel(getValue("nivelEducativo"), NIVELES_EDUCATIVOS)}
              onChange={(v) => handleFieldChange("nivelEducativo", v)}
              type="select"
              options={[...NIVELES_EDUCATIVOS]}
              icon={GraduationCap}
            />
          </div>
        </DetailSection>

        <Separator />

        {/* Datos de Contacto */}
        <DetailSection title="Datos de Contacto">
          <div className="grid grid-cols-2 gap-4">
            <EditableField
              label="Email"
              value={getValue("email")}
              onChange={(v) => handleFieldChange("email", v)}
              icon={Mail}
            />
            <EditableField
              label="Teléfono"
              value={getValue("telefono")}
              onChange={(v) => handleFieldChange("telefono", v)}
              icon={Phone}
            />
          </div>
        </DetailSection>

        <Separator />

        {/* Contacto de Emergencia */}
        <DetailSection title="Contacto de Emergencia">
          <div className="grid grid-cols-2 gap-4">
            <EditableField
              label="Nombre"
              value={
                (formData.contactoEmergencia as PersonaFormData["contactoEmergencia"])?.nombre ??
                persona.contactoEmergencia.nombre
              }
              onChange={(v) => handleNestedFieldChange("contactoEmergencia", "nombre", v)}
              icon={AlertCircle}
            />
            <EditableField
              label="Teléfono"
              value={
                (formData.contactoEmergencia as PersonaFormData["contactoEmergencia"])?.telefono ??
                persona.contactoEmergencia.telefono
              }
              onChange={(v) => handleNestedFieldChange("contactoEmergencia", "telefono", v)}
              icon={Phone}
            />
            <EditableField
              label="Parentesco"
              value={
                (formData.contactoEmergencia as PersonaFormData["contactoEmergencia"])?.parentesco ??
                persona.contactoEmergencia.parentesco
              }
              onChange={(v) => handleNestedFieldChange("contactoEmergencia", "parentesco", v)}
              icon={User}
            />
          </div>
        </DetailSection>

        <Separator />

        {/* Historial de Matrículas */}
        <DetailSection title="Matrículas">
          {matriculas.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Sin matrículas registradas
            </p>
          ) : (
            <div className="space-y-1.5">
              {matriculas.map((m) => (
                <div
                  key={m.id}
                  className="p-2 border rounded hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/matriculas/${m.id}`);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {m.empresaNivelFormacion ? NIVEL_FORMACION_EMPRESA_LABELS[m.empresaNivelFormacion] : 'Sin nivel'}
                    </span>
                    <StatusBadge status={m.estado} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(m.createdAt), "dd/MM/yyyy")}
                  </p>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => {
              onOpenChange(false);
              navigate(`/matriculas/nueva?personaId=${persona.id}`);
            }}
          >
            Nueva Matrícula
          </Button>
        </DetailSection>
      </div>
    </DetailSheet>
  );
}
