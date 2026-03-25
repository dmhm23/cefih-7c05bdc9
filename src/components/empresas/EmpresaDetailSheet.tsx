import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, FileText, MapPin, Phone, Mail, User, Shield, Users } from "lucide-react";
import { DetailSheet, DetailSection } from "@/components/shared/DetailSheet";
import { EditableField } from "@/components/shared/EditableField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUpdateEmpresa } from "@/hooks/useEmpresas";
import { useMatriculas } from "@/hooks/useMatriculas";
import { Empresa, EmpresaFormData } from "@/types/empresa";
import { SECTORES_ECONOMICOS, ARL_OPTIONS } from "@/data/formOptions";
import { Separator } from "@/components/ui/separator";

interface EmpresaDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa: Empresa | null;
  currentIndex: number;
  totalCount: number;
  onNavigate: (direction: "prev" | "next") => void;
}

export function EmpresaDetailSheet({
  open,
  onOpenChange,
  empresa,
  currentIndex,
  totalCount,
  onNavigate,
}: EmpresaDetailSheetProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const updateEmpresa = useUpdateEmpresa();
  const [formData, setFormData] = useState<Partial<EmpresaFormData>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFormData({});
    setIsDirty(false);
  }, [empresa?.id]);

  if (!empresa) return null;

  const handleFieldChange = (field: keyof EmpresaFormData, value: string) => {
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

  const handleClose = (newOpen: boolean) => {
    if (!newOpen && isDirty) handleCancel();
    onOpenChange(newOpen);
  };

  const getValue = <K extends keyof Empresa>(field: K): Empresa[K] => {
    return (formData[field as keyof EmpresaFormData] as Empresa[K]) ?? empresa[field];
  };

  const getDisplayLabel = (value: string, options: readonly { value: string; label: string }[]) => {
    return options.find(o => o.value === value)?.label || value;
  };

  const handleFullScreen = () => {
    onOpenChange(false);
    navigate(`/empresas/${empresa.id}`);
  };

  return (
    <DetailSheet
      open={open}
      onOpenChange={handleClose}
      title={getValue("nombreEmpresa")}
      subtitle={`NIT: ${getValue("nit")}`}
      currentIndex={currentIndex}
      totalCount={totalCount}
      onNavigate={onNavigate}
      onFullScreen={handleFullScreen}
      countLabel="empresas"
      footer={
        isDirty ? (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
            <Button onClick={handleSave} disabled={updateEmpresa.isPending}>
              {updateEmpresa.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Badge variant={getValue("activo") ? "default" : "secondary"}>
            {getValue("activo") ? "Activa" : "Inactiva"}
          </Badge>
        </div>

        <DetailSection title="Información General">
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
        </DetailSection>

        <Separator />

        <DetailSection title="Datos de Contacto">
          <div className="grid grid-cols-2 gap-4">
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
        </DetailSection>
      </div>
    </DetailSheet>
  );
}
