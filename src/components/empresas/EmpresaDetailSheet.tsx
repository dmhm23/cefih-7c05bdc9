import { useState, useEffect } from "react";
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { useNavigate } from "react-router-dom";
import { Building2, FileText, MapPin, Phone, Mail, User, Shield, Users, Plus, Trash2, Star } from "lucide-react";
import { DetailSheet, DetailSection } from "@/components/shared/DetailSheet";
import { EditableField } from "@/components/shared/EditableField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUpdateEmpresa } from "@/hooks/useEmpresas";
import { useMatriculas } from "@/hooks/useMatriculas";
import { Empresa, EmpresaFormData, ContactoEmpresa } from "@/types/empresa";
import { SECTORES_ECONOMICOS, ARL_OPTIONS } from "@/data/formOptions";
import { resolveCatalogLabel } from "@/utils/resolveCatalogLabel";
import { Separator } from "@/components/ui/separator";
import { v4 as uuid } from "uuid";

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
  const { logActivity } = useActivityLogger();
  const updateEmpresa = useUpdateEmpresa();
  const { data: matriculas = [] } = useMatriculas();
  const [formData, setFormData] = useState<Partial<EmpresaFormData>>({});
  const [contactos, setContactos] = useState<ContactoEmpresa[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFormData({});
    setIsDirty(false);
    if (empresa) {
      setContactos(empresa.contactos?.length ? [...empresa.contactos] : []);
    }
  }, [empresa?.id]);

  if (!empresa) return null;

  const estudiantesCount = matriculas.filter(m => m.empresaId === empresa.id || m.empresaNit === empresa.nit).length;

  const handleFieldChange = (field: keyof EmpresaFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleContactoChange = (index: number, field: keyof Omit<ContactoEmpresa, 'id' | 'esPrincipal'>, value: string) => {
    setContactos(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
    setIsDirty(true);
  };

  const handleAddContacto = () => {
    setContactos(prev => [...prev, { id: uuid(), nombre: "", telefono: "", email: "", esPrincipal: false }]);
    setIsDirty(true);
  };

  const handleRemoveContacto = (index: number) => {
    setContactos(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some(c => c.esPrincipal)) {
        updated[0].esPrincipal = true;
      }
      return updated;
    });
    setIsDirty(true);
  };

  const handleSetPrincipal = (index: number) => {
    setContactos(prev => prev.map((c, i) => ({ ...c, esPrincipal: i === index })));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      const principal = contactos.find(c => c.esPrincipal) || contactos[0];
      await updateEmpresa.mutateAsync({
        id: empresa.id,
        data: {
          ...formData,
          contactos,
          personaContacto: principal?.nombre || "",
          telefonoContacto: principal?.telefono || "",
          emailContacto: principal?.email || "",
        }
      });
      toast({ title: "Cambios guardados correctamente" });
      logActivity({ action: "editar", module: "empresas", description: `Editó empresa "${getValue("nombreEmpresa")}" desde panel lateral`, entityType: "empresa", entityId: empresa.id, metadata: { campos_modificados: Object.keys(formData) } });
      setFormData({});
      setIsDirty(false);
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    }
  };

  const handleCancel = () => {
    setFormData({});
    setIsDirty(false);
    if (empresa) {
      setContactos(empresa.contactos?.length ? [...empresa.contactos] : []);
    }
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
              displayValue={resolveCatalogLabel(getValue("sectorEconomico"), getValue("sectorEconomicoOtro") as string | undefined, SECTORES_ECONOMICOS)}
              onChange={v => handleFieldChange("sectorEconomico", v)}
              type="select"
              options={[...SECTORES_ECONOMICOS]}
              icon={Building2}
            />
            {getValue("sectorEconomico") === "otro_sector" && (
              <EditableField
                label="Sector (especifique)"
                value={(getValue("sectorEconomicoOtro") as string) || ""}
                onChange={v => handleFieldChange("sectorEconomicoOtro" as any, v)}
              />
            )}
            <EditableField
              label="ARL"
              value={getValue("arl")}
              displayValue={resolveCatalogLabel(getValue("arl"), getValue("arlOtra") as string | undefined, ARL_OPTIONS)}
              onChange={v => handleFieldChange("arl", v)}
              type="select"
              options={[...ARL_OPTIONS]}
              icon={Shield}
            />
            {getValue("arl") === "otra_arl" && (
              <EditableField
                label="Nombre ARL"
                value={(getValue("arlOtra") as string) || ""}
                onChange={v => handleFieldChange("arlOtra" as any, v)}
              />
            )}
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

        <DetailSection title="Personas de Contacto">
          <div className="space-y-3">
            {contactos.map((contacto, index) => (
              <div key={contacto.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Contacto {index + 1}</span>
                    {contacto.esPrincipal ? (
                      <Badge variant="default" className="text-[10px] h-5">Principal</Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 text-[10px] text-muted-foreground px-1.5"
                        onClick={() => handleSetPrincipal(index)}
                      >
                        <Star className="h-3 w-3 mr-0.5" />
                        Principal
                      </Button>
                    )}
                  </div>
                  {contactos.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveContacto(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Nombre</label>
                    <Input
                      value={contacto.nombre}
                      onChange={e => handleContactoChange(index, "nombre", e.target.value)}
                      placeholder="Nombre completo"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Teléfono</label>
                    <Input
                      value={contacto.telefono}
                      onChange={e => handleContactoChange(index, "telefono", e.target.value)}
                      placeholder="3001234567"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Email</label>
                    <Input
                      type="email"
                      value={contacto.email}
                      onChange={e => handleContactoChange(index, "email", e.target.value)}
                      placeholder="contacto@empresa.com"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleAddContacto}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Agregar contacto
            </Button>
          </div>
        </DetailSection>

        <Separator />

        <DetailSection title="Estudiantes Enviados">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{estudiantesCount} matrícula(s)</span>
            </div>
            <Button
              variant="link"
              size="sm"
              className="px-0 h-auto text-xs"
              onClick={handleFullScreen}
            >
              Ver todos →
            </Button>
          </div>
        </DetailSection>
      </div>
    </DetailSheet>
  );
}
