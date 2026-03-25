import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Building2, FileText, MapPin, Phone, Mail, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmpresa, useUpdateEmpresa } from "@/hooks/useEmpresas";
import { EditableField } from "@/components/shared/EditableField";
import { useToast } from "@/hooks/use-toast";
import { Empresa, EmpresaFormData } from "@/types/empresa";
import { SECTORES_ECONOMICOS, ARL_OPTIONS } from "@/data/formOptions";

export default function EmpresaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string })?.from || "/empresas";
  const { toast } = useToast();

  const { data: empresa, isLoading } = useEmpresa(id || "");
  const updateEmpresa = useUpdateEmpresa();

  const [formData, setFormData] = useState<Partial<EmpresaFormData>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFormData({});
    setIsDirty(false);
  }, [empresa?.id]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Empresa no encontrada</p>
        <Button variant="link" onClick={() => navigate("/empresas")}>
          Volver al listado
        </Button>
      </div>
    );
  }

  const handleFieldChange = (field: keyof EmpresaFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateEmpresa.mutateAsync({ id: empresa.id, data: formData });
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

  const getValue = <K extends keyof Empresa>(field: K): Empresa[K] => {
    return (formData[field as keyof EmpresaFormData] as Empresa[K]) ?? empresa[field];
  };

  const getDisplayLabel = (value: string, options: readonly { value: string; label: string }[]) => {
    return options.find(o => o.value === value)?.label || value;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(fromPath)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{getValue("nombreEmpresa")}</h1>
            <Badge variant={getValue("activo") ? "default" : "secondary"}>
              {getValue("activo") ? "Activa" : "Inactiva"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">NIT: {getValue("nit")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Información General */}
        <div className="border rounded-lg p-4 shadow-sm space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Información General
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <EditableField
              label="Nombre Empresa"
              value={getValue("nombreEmpresa")}
              onChange={v => handleFieldChange("nombreEmpresa", v)}
              icon={Building2}
            />
            <EditableField
              label="NIT"
              value={getValue("nit")}
              onChange={v => handleFieldChange("nit", v)}
              icon={FileText}
            />
            <EditableField
              label="Representante Legal"
              value={getValue("representanteLegal")}
              onChange={v => handleFieldChange("representanteLegal", v)}
              icon={User}
            />
            <EditableField
              label="Sector Económico"
              value={getValue("sectorEconomico")}
              displayValue={getDisplayLabel(getValue("sectorEconomico"), SECTORES_ECONOMICOS)}
              onChange={v => handleFieldChange("sectorEconomico", v)}
              type="select"
              options={[...SECTORES_ECONOMICOS]}
              icon={Building2}
            />
            <EditableField
              label="ARL"
              value={getValue("arl")}
              displayValue={getDisplayLabel(getValue("arl"), ARL_OPTIONS)}
              onChange={v => handleFieldChange("arl", v)}
              type="select"
              options={[...ARL_OPTIONS]}
              icon={Shield}
            />
            <EditableField
              label="Dirección"
              value={getValue("direccion")}
              onChange={v => handleFieldChange("direccion", v)}
              icon={MapPin}
            />
            <EditableField
              label="Teléfono Empresa"
              value={getValue("telefonoEmpresa")}
              onChange={v => handleFieldChange("telefonoEmpresa", v)}
              icon={Phone}
            />
          </div>
        </div>

        {/* Datos de Contacto */}
        <div className="border rounded-lg p-4 shadow-sm space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Datos de Contacto
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <EditableField
              label="Persona de Contacto"
              value={getValue("personaContacto")}
              onChange={v => handleFieldChange("personaContacto", v)}
              icon={User}
            />
            <EditableField
              label="Teléfono Contacto"
              value={getValue("telefonoContacto")}
              onChange={v => handleFieldChange("telefonoContacto", v)}
              icon={Phone}
            />
            <EditableField
              label="Email Contacto"
              value={getValue("emailContacto")}
              onChange={v => handleFieldChange("emailContacto", v)}
              icon={Mail}
            />
          </div>
        </div>
      </div>

      {isDirty && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-background border rounded-lg shadow-lg p-3">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateEmpresa.isPending}>
            {updateEmpresa.isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      )}
    </div>
  );
}
