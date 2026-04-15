import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { Skeleton } from "@/components/ui/skeleton";
import { usePersona, useUpdatePersona } from "@/hooks/usePersonas";
import { useMatriculasByPersona } from "@/hooks/useMatriculas";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useResolveNivel } from "@/hooks/useResolveNivel";
import { EditableField } from "@/components/shared/EditableField";
import { useToast } from "@/hooks/use-toast";
import { Persona, PersonaFormData } from "@/types/persona";
import {
  TIPOS_DOCUMENTO,
  GENEROS,
  NIVELES_EDUCATIVOS,
  GRUPOS_SANGUINEOS,
  PAISES,
} from "@/data/formOptions";
import {
  FileText,
  User,
  UserCircle,
  Globe,
  Calendar,
  Droplet,
  GraduationCap,
  Mail,
  Phone,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

export default function PersonaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string })?.from || "/personas";
  const { toast } = useToast();

  const { data: persona, isLoading } = usePersona(id || "");
  const { data: matriculas = [] } = useMatriculasByPersona(id || "");
  const resolveNivel = useResolveNivel();
  const updatePersona = useUpdatePersona();

  const [formData, setFormData] = useState<Partial<PersonaFormData>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFormData({});
    setIsDirty(false);
  }, [persona?.id]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Persona no encontrada</p>
        <Button variant="link" onClick={() => navigate("/personas")}>
          Volver al listado
        </Button>
      </div>
    );
  }

  const handleFieldChange = (field: keyof PersonaFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleNestedFieldChange = (parent: "contactoEmergencia", field: string, value: string) => {
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
      await updatePersona.mutateAsync({ id: persona.id, data: formData });
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

  const getValue = <K extends keyof Persona>(field: K): Persona[K] => {
    return (formData[field as keyof PersonaFormData] as Persona[K]) ?? persona[field];
  };

  const getDisplayLabel = (value: string, options: readonly { value: string; label: string }[]) => {
    return options.find((o) => o.value === value)?.label || value;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <IconButton tooltip="Volver" onClick={() => navigate(fromPath)}>
          <ArrowLeft className="h-4 w-4" />
        </IconButton>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold">{getValue("nombres")} {getValue("apellidos")}</h1>
          <p className="text-sm text-muted-foreground">{getValue("tipoDocumento")}: {getValue("numeroDocumento")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Datos Personales */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Datos Personales
            </h3>
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
          </div>

          {/* Datos de Contacto */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Datos de Contacto
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <EditableField
                label="Teléfono"
                value={getValue("telefono")}
                onChange={(v) => handleFieldChange("telefono", v)}
                icon={Phone}
              />
              <EditableField
                label="Email"
                value={getValue("email")}
                onChange={(v) => handleFieldChange("email", v)}
                icon={Mail}
              />
            </div>
          </div>

          {/* Contacto de Emergencia */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contacto de Emergencia
            </h3>
            <div className="grid grid-cols-3 gap-4">
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
          </div>
        </div>

        {/* Matrículas */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Matrículas
          </h3>
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
                  onClick={() => navigate(`/matriculas/${m.id}`, { state: { from: `/personas/${id}`, fromLabel: "Persona" } })}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {m.nivelFormacionId ? resolveNivel(m.nivelFormacionId) : 'Sin nivel'}
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
            onClick={() => navigate(`/matriculas/nueva?personaId=${id}`)}
          >
            Nueva Matrícula
          </Button>
        </div>
      </div>

      {/* Barra flotante de guardar */}
      {isDirty && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-background border rounded-lg shadow-lg p-3">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updatePersona.isPending}>
            {updatePersona.isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      )}
    </div>
  );
}
