import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  BookOpen,
  FileCheck,
  CreditCard,
  Calendar,
  CheckCircle2,
  Circle,
  FileText,
  ClipboardList,
  PenTool,
  Receipt,
  Building2,
  GraduationCap,
  Briefcase,
  HeartPulse,
  ShieldCheck,
  AlertTriangle,
  Check,
  X,
  Wallet,
  Award,
  MessageSquareText,
  Mail,
  Phone,
  UserCircle,
  Droplet,
  Globe,
  AlertCircle,
} from "lucide-react";
import { DetailSheet, DetailSection } from "@/components/shared/DetailSheet";
import { EditableField } from "@/components/shared/EditableField";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateMatricula, useCambiarEstadoMatricula, useRegistrarPago, useCapturarFirma, useUploadDocumento } from "@/hooks/useMatriculas";
import { usePersonas, useUpdatePersona } from "@/hooks/usePersonas";
import { useCursos } from "@/hooks/useCursos";
import { PersonaFormData } from "@/types/persona";
import {
  Matricula, ESTADO_MATRICULA_LABELS, TIPO_FORMACION_LABELS, EstadoMatricula, TipoFormacion,
  NIVEL_PREVIO_LABELS, TIPO_VINCULACION_LABELS, NIVEL_FORMACION_EMPRESA_LABELS, FORMA_PAGO_LABELS, FormaPago,
} from "@/types/matricula";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FirmaCaptura } from "@/components/matriculas/FirmaCaptura";
import { DocumentosCarga } from "@/components/matriculas/DocumentosCarga";
import {
  AREAS_TRABAJO,
  SECTORES_ECONOMICOS,
  TIPOS_DOCUMENTO,
  GENEROS,
  NIVELES_EDUCATIVOS,
  GRUPOS_SANGUINEOS,
  PAISES,
  TIPOS_VINCULACION,
  NIVELES_FORMACION_EMPRESA,
  FORMAS_PAGO,
  NIVELES_PREVIOS,
} from "@/data/formOptions";

interface MatriculaDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matricula: Matricula | null;
  currentIndex: number;
  totalCount: number;
  onNavigate: (direction: "prev" | "next") => void;
}

const ESTADO_OPTIONS = [
  { value: "creada", label: "Creada" },
  { value: "pendiente", label: "Pendiente" },
  { value: "completa", label: "Completa" },
  { value: "certificada", label: "Certificada" },
  { value: "cerrada", label: "Cerrada" },
];

const TIPO_FORMACION_OPTIONS = [
  { value: "inicial", label: "Formación Inicial" },
  { value: "reentrenamiento", label: "Reentrenamiento" },
  { value: "avanzado", label: "Nivel Avanzado" },
  { value: "coordinador", label: "Coordinador de Alturas" },
];

export function MatriculaDetailSheet({
  open,
  onOpenChange,
  matricula,
  currentIndex,
  totalCount,
  onNavigate,
}: MatriculaDetailSheetProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const updateMatricula = useUpdateMatricula();
  const cambiarEstado = useCambiarEstadoMatricula();
  const registrarPago = useRegistrarPago();
  const capturarFirma = useCapturarFirma();
  const uploadDocumento = useUploadDocumento();
  const { data: personas = [] } = usePersonas();
  const { data: cursos = [] } = useCursos();
  const updatePersona = useUpdatePersona();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [personaFormData, setPersonaFormData] = useState<Partial<PersonaFormData>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isPersonaDirty, setIsPersonaDirty] = useState(false);
  const [firmaDialogOpen, setFirmaDialogOpen] = useState(false);

  useEffect(() => {
    setFormData({});
    setPersonaFormData({});
    setIsDirty(false);
    setIsPersonaDirty(false);
  }, [matricula?.id]);

  if (!matricula) return null;

  const persona = personas.find((p) => p.id === matricula.personaId);
  const curso = cursos.find((c) => c.id === matricula.cursoId);

  const handleFieldChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handlePersonaFieldChange = (field: keyof PersonaFormData, value: string) => {
    setPersonaFormData((prev) => ({ ...prev, [field]: value }));
    setIsPersonaDirty(true);
  };

  const handlePersonaNestedFieldChange = (parent: "contactoEmergencia", field: string, value: string) => {
    if (!persona) return;
    setPersonaFormData((prev) => ({
      ...prev,
      [parent]: {
        ...persona[parent],
        ...(prev[parent] as object || {}),
        [field]: value,
      },
    }));
    setIsPersonaDirty(true);
  };

  const handleSave = async () => {
    try {
      // Save persona changes
      if (isPersonaDirty && persona) {
        await updatePersona.mutateAsync({ id: persona.id, data: personaFormData });
      }
      // Save matricula changes
      if (formData.estado && formData.estado !== matricula.estado) {
        await cambiarEstado.mutateAsync({
          id: matricula.id,
          estado: formData.estado as EstadoMatricula,
        });
      }
      const otherChanges = { ...formData };
      delete otherChanges.estado;
      if (Object.keys(otherChanges).length > 0) {
        await updateMatricula.mutateAsync({ id: matricula.id, data: otherChanges });
      }
      toast({ title: "Cambios guardados correctamente" });
      setFormData({});
      setPersonaFormData({});
      setIsDirty(false);
      setIsPersonaDirty(false);
    } catch (error) {
      toast({ title: "Error al guardar", description: "No se pudieron guardar los cambios", variant: "destructive" });
    }
  };

  const handleCancel = () => { setFormData({}); setPersonaFormData({}); setIsDirty(false); setIsPersonaDirty(false); };

  const handleRegistrarPago = async () => {
    try {
      await registrarPago.mutateAsync({ id: matricula.id, datosPago: { ctaFactNumero: `FAC-${Date.now()}` } });
      toast({ title: "Pago registrado correctamente" });
    } catch (error) {
      toast({ title: "Error al registrar pago", variant: "destructive" });
    }
  };

  const handleCapturarFirma = async (firmaBase64: string) => {
    try {
      await capturarFirma.mutateAsync({ id: matricula.id, firmaBase64 });
      toast({ title: "Firma capturada correctamente" });
      setFirmaDialogOpen(false);
    } catch (error) {
      toast({ title: "Error al capturar firma", variant: "destructive" });
    }
  };

  const handleUploadDoc = async (documentoId: string, file: File) => {
    try {
      await uploadDocumento.mutateAsync({
        matriculaId: matricula.id,
        documentoId,
        file,
        metadata: {
          cursoId: matricula.cursoId,
          personaNombre: persona ? `${persona.nombres} ${persona.apellidos}` : undefined,
          personaCedula: persona?.numeroDocumento,
        },
      });
      toast({ title: "Documento cargado correctamente" });
    } catch (error) {
      toast({ title: "Error al cargar documento", variant: "destructive" });
    }
  };

  const getValue = <K extends keyof Matricula>(field: K): Matricula[K] => {
    return (formData[field] as Matricula[K]) ?? matricula[field];
  };

  const getPersonaValue = <K extends keyof PersonaFormData>(field: K) => {
    if (field === 'contactoEmergencia') {
      return {
        ...persona?.contactoEmergencia,
        ...(personaFormData.contactoEmergencia as object || {}),
      };
    }
    return (personaFormData[field] as string) ?? (persona?.[field] as string) ?? "";
  };

  const getDisplayLabel = (value: string | undefined, options: readonly { value: string; label: string }[]) => {
    if (!value) return "—";
    return options.find((o) => o.value === value)?.label || value;
  };

  const completedSteps = [
    matricula.firmaCapturada,
    matricula.documentos.every((d) => d.estado === "verificado"),
    matricula.evaluacionCompletada,
    matricula.encuestaCompletada,
    matricula.pagado,
    matricula.consentimientoSalud,
  ].filter(Boolean).length;
  const progressPercent = (completedSteps / 6) * 100;

  const personaName = persona ? `${persona.nombres} ${persona.apellidos}` : "N/A";
  const personaDoc = persona?.numeroDocumento || "";
  const cursoName = curso?.nombre || "Sin curso asignado";

  const handleFullScreen = () => {
    if (matricula) { onOpenChange(false); navigate(`/matriculas/${matricula.id}`); }
  };

  const ConsentIcon = ({ value }: { value: boolean }) => (
    value
      ? <Check className="h-3.5 w-3.5 text-emerald-600" />
      : <X className="h-3.5 w-3.5 text-muted-foreground" />
  );

  return (
    <>
      <DetailSheet
        open={open}
        onOpenChange={onOpenChange}
        title={personaName}
        subtitle={cursoName}
        currentIndex={currentIndex}
        totalCount={totalCount}
        onNavigate={onNavigate}
        onFullScreen={handleFullScreen}
        countLabel="matrículas"
        footer={
          (isDirty || isPersonaDirty) ? (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
              <Button onClick={handleSave} disabled={updateMatricula.isPending || cambiarEstado.isPending || updatePersona.isPending}>
                {updateMatricula.isPending || cambiarEstado.isPending || updatePersona.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso de matrícula</span>
              <span className="font-medium">{completedSteps}/6 completados</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          <Separator />

          {/* Estado y Tipo */}
          <DetailSection title="Estado de la Matrícula">
            <div className="grid grid-cols-2 gap-4">
              <EditableField
                label="Estado"
                value={getValue("estado")}
                displayValue={ESTADO_MATRICULA_LABELS[getValue("estado")]}
                onChange={(v) => handleFieldChange("estado", v)}
                type="select"
                options={ESTADO_OPTIONS}
                icon={FileCheck}
                badge
                badgeVariant={getValue("estado") === "certificada" ? "default" : getValue("estado") === "cerrada" ? "destructive" : "secondary"}
              />
              <EditableField
                label="Tipo de Formación"
                value={getValue("tipoFormacion")}
                displayValue={TIPO_FORMACION_LABELS[getValue("tipoFormacion")]}
                onChange={(v) => handleFieldChange("tipoFormacion", v)}
                type="select"
                options={TIPO_FORMACION_OPTIONS}
                icon={BookOpen}
                badge
                badgeVariant="outline"
              />
            </div>
          </DetailSection>

          <Separator />

          {/* Estudiante */}
          <DetailSection title="Estudiante">
            {persona ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <EditableField
                    label="Nombres"
                    value={getPersonaValue("nombres") as string}
                    onChange={(v) => handlePersonaFieldChange("nombres", v)}
                    icon={User}
                  />
                  <EditableField
                    label="Apellidos"
                    value={getPersonaValue("apellidos") as string}
                    onChange={(v) => handlePersonaFieldChange("apellidos", v)}
                    icon={User}
                  />
                  <EditableField
                    label="Tipo Doc."
                    value={getPersonaValue("tipoDocumento") as string}
                    displayValue={getDisplayLabel(getPersonaValue("tipoDocumento") as string, TIPOS_DOCUMENTO)}
                    onChange={(v) => handlePersonaFieldChange("tipoDocumento", v)}
                    type="select"
                    options={[...TIPOS_DOCUMENTO]}
                    icon={FileText}
                    badge
                  />
                  <EditableField
                    label="No. Documento"
                    value={getPersonaValue("numeroDocumento") as string}
                    onChange={(v) => handlePersonaFieldChange("numeroDocumento", v)}
                    icon={FileText}
                  />
                  <EditableField
                    label="Email"
                    value={getPersonaValue("email") as string}
                    onChange={(v) => handlePersonaFieldChange("email", v)}
                    icon={Mail}
                  />
                  <EditableField
                    label="Teléfono"
                    value={getPersonaValue("telefono") as string}
                    onChange={(v) => handlePersonaFieldChange("telefono", v)}
                    icon={Phone}
                  />
                  <EditableField
                    label="Género"
                    value={getPersonaValue("genero") as string}
                    displayValue={getDisplayLabel(getPersonaValue("genero") as string, GENEROS)}
                    onChange={(v) => handlePersonaFieldChange("genero", v)}
                    type="select"
                    options={[...GENEROS]}
                    icon={UserCircle}
                    badge
                  />
                  <EditableField
                    label="Fecha Nacimiento"
                    value={getPersonaValue("fechaNacimiento") as string}
                    onChange={(v) => handlePersonaFieldChange("fechaNacimiento", v)}
                    type="date"
                    icon={Calendar}
                  />
                  <EditableField
                    label="RH"
                    value={getPersonaValue("rh") as string}
                    displayValue={getDisplayLabel(getPersonaValue("rh") as string, GRUPOS_SANGUINEOS)}
                    onChange={(v) => handlePersonaFieldChange("rh", v)}
                    type="select"
                    options={[...GRUPOS_SANGUINEOS]}
                    icon={Droplet}
                    badge
                    badgeVariant="outline"
                  />
                  <EditableField
                    label="Nivel Educativo"
                    value={getPersonaValue("nivelEducativo") as string}
                    displayValue={getDisplayLabel(getPersonaValue("nivelEducativo") as string, NIVELES_EDUCATIVOS)}
                    onChange={(v) => handlePersonaFieldChange("nivelEducativo", v)}
                    type="select"
                    options={[...NIVELES_EDUCATIVOS]}
                    icon={GraduationCap}
                  />
                  <EditableField
                    label="País Nacimiento"
                    value={getPersonaValue("paisNacimiento") as string}
                    displayValue={getDisplayLabel(getPersonaValue("paisNacimiento") as string, PAISES)}
                    onChange={(v) => handlePersonaFieldChange("paisNacimiento", v)}
                    type="select"
                    options={[...PAISES]}
                    icon={Globe}
                  />
                </div>
                {/* Contacto de Emergencia */}
                <div className="pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Contacto de Emergencia</p>
                  <div className="grid grid-cols-2 gap-4">
                    <EditableField
                      label="Nombre"
                      value={(getPersonaValue("contactoEmergencia") as any)?.nombre ?? ""}
                      onChange={(v) => handlePersonaNestedFieldChange("contactoEmergencia", "nombre", v)}
                      icon={AlertCircle}
                    />
                    <EditableField
                      label="Teléfono"
                      value={(getPersonaValue("contactoEmergencia") as any)?.telefono ?? ""}
                      onChange={(v) => handlePersonaNestedFieldChange("contactoEmergencia", "telefono", v)}
                      icon={Phone}
                    />
                    <EditableField
                      label="Parentesco"
                      value={(getPersonaValue("contactoEmergencia") as any)?.parentesco ?? ""}
                      onChange={(v) => handlePersonaNestedFieldChange("contactoEmergencia", "parentesco", v)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Persona no encontrada</p>
            )}
          </DetailSection>

          <Separator />

          {/* Curso */}
          <DetailSection title="Curso">
            <EditableField
              label="Curso"
              value={getValue("cursoId")}
              displayValue={cursoName}
              onChange={(v) => handleFieldChange("cursoId", v)}
              type="select"
              options={cursos.map((c) => ({ value: c.id, label: c.nombre }))}
              icon={BookOpen}
            />
            {curso && (
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(curso.fechaInicio), "d MMM", { locale: es })} -{" "}
                {format(new Date(curso.fechaFin), "d MMM yyyy", { locale: es })}
              </p>
            )}
          </DetailSection>

          <Separator />

          {/* Historial de Formación Previa */}
          {(matricula.nivelPrevio || matricula.centroFormacionPrevio || matricula.fechaCertificacionPrevia) && (
            <>
              <DetailSection title="Historial de Formación Previa">
                <div className="grid grid-cols-2 gap-4">
                  {matricula.nivelPrevio && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><GraduationCap className="h-3 w-3" /> Nivel Previo</p>
                      <p className="text-sm font-medium">{NIVEL_PREVIO_LABELS[matricula.nivelPrevio]}</p>
                    </div>
                  )}
                  {matricula.centroFormacionPrevio && (
                    <div>
                      <p className="text-xs text-muted-foreground">Centro de Formación</p>
                      <p className="text-sm font-medium">{matricula.centroFormacionPrevio}</p>
                    </div>
                  )}
                  {matricula.fechaCertificacionPrevia && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Fecha Certificación</p>
                      <p className="text-sm font-medium">{matricula.fechaCertificacionPrevia}</p>
                    </div>
                  )}
                </div>
              </DetailSection>
              <Separator />
            </>
          )}

          {/* Vinculación Laboral */}
          <DetailSection title="Vinculación Laboral">
            <div className="grid grid-cols-2 gap-4">
              <EditableField
                label="Tipo"
                value={getValue("tipoVinculacion") || ""}
                displayValue={getValue("tipoVinculacion") ? TIPO_VINCULACION_LABELS[getValue("tipoVinculacion")!] : undefined}
                onChange={(v) => handleFieldChange("tipoVinculacion", v)}
                type="select"
                options={[...TIPOS_VINCULACION]}
                icon={Briefcase}
                badge
                badgeVariant="outline"
              />
              <EditableField
                label="Cargo"
                value={getValue("empresaCargo") || ""}
                onChange={(v) => handleFieldChange("empresaCargo", v)}
              />
              <EditableField
                label="Nivel de Formación"
                value={getValue("empresaNivelFormacion") || ""}
                displayValue={getValue("empresaNivelFormacion") ? NIVEL_FORMACION_EMPRESA_LABELS[getValue("empresaNivelFormacion")!] : undefined}
                onChange={(v) => handleFieldChange("empresaNivelFormacion", v)}
                type="select"
                options={[...NIVELES_FORMACION_EMPRESA]}
                icon={GraduationCap}
              />
              <EditableField
                label="Área de Trabajo"
                value={getValue("areaTrabajo") || ""}
                displayValue={getDisplayLabel(getValue("areaTrabajo") || "", AREAS_TRABAJO)}
                onChange={(v) => handleFieldChange("areaTrabajo", v)}
                type="select"
                options={[...AREAS_TRABAJO]}
                icon={Briefcase}
              />
              <div className="col-span-2">
                <EditableField
                  label="Sector Económico"
                  value={getValue("sectorEconomico") || ""}
                  displayValue={getDisplayLabel(getValue("sectorEconomico") || "", SECTORES_ECONOMICOS)}
                  onChange={(v) => handleFieldChange("sectorEconomico", v)}
                  type="select"
                  options={[...SECTORES_ECONOMICOS]}
                  icon={Building2}
                />
              </div>
              {(getValue("tipoVinculacion") === 'empresa' || getValue("tipoVinculacion") === 'independiente') && (
                <>
                  <EditableField
                    label="Empresa"
                    value={getValue("empresaNombre") || ""}
                    onChange={(v) => handleFieldChange("empresaNombre", v)}
                    icon={Building2}
                  />
                  <EditableField
                    label="NIT"
                    value={getValue("empresaNit") || ""}
                    onChange={(v) => handleFieldChange("empresaNit", v)}
                  />
                </>
              )}
              {getValue("tipoVinculacion") === 'empresa' && (
                <>
                  <EditableField
                    label="Contacto Empresa"
                    value={getValue("empresaContactoNombre") || ""}
                    onChange={(v) => handleFieldChange("empresaContactoNombre", v)}
                  />
                  <EditableField
                    label="Tel. Contacto"
                    value={getValue("empresaContactoTelefono") || ""}
                    onChange={(v) => handleFieldChange("empresaContactoTelefono", v)}
                    icon={Phone}
                  />
                </>
              )}
            </div>
          </DetailSection>
          <Separator />

          {/* Consentimiento de Salud */}
          <DetailSection title="Consentimiento de Salud">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Consentimiento completado</span>
                <Switch
                  checked={getValue("consentimientoSalud") as unknown as boolean}
                  onCheckedChange={(v) => handleFieldChange("consentimientoSalud", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Restricción médica</span>
                <Switch
                  checked={getValue("restriccionMedica") as unknown as boolean}
                  onCheckedChange={(v) => handleFieldChange("restriccionMedica", v)}
                />
              </div>
              {getValue("restriccionMedica") && (
                <EditableField
                  label="Detalle restricción"
                  value={(getValue("restriccionMedicaDetalle") as string) || ""}
                  onChange={(v) => handleFieldChange("restriccionMedicaDetalle", v)}
                />
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm">Alergias</span>
                <Switch
                  checked={getValue("alergias") as unknown as boolean}
                  onCheckedChange={(v) => handleFieldChange("alergias", v)}
                />
              </div>
              {getValue("alergias") && (
                <EditableField
                  label="Detalle alergias"
                  value={(getValue("alergiasDetalle") as string) || ""}
                  onChange={(v) => handleFieldChange("alergiasDetalle", v)}
                />
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm">Consumo de medicamentos</span>
                <Switch
                  checked={getValue("consumoMedicamentos") as unknown as boolean}
                  onCheckedChange={(v) => handleFieldChange("consumoMedicamentos", v)}
                />
              </div>
              {getValue("consumoMedicamentos") && (
                <EditableField
                  label="Detalle medicamentos"
                  value={(getValue("consumoMedicamentosDetalle") as string) || ""}
                  onChange={(v) => handleFieldChange("consumoMedicamentosDetalle", v)}
                />
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm">Nivel de lectoescritura</span>
                <Switch
                  checked={getValue("nivelLectoescritura") as unknown as boolean}
                  onCheckedChange={(v) => handleFieldChange("nivelLectoescritura", v)}
                />
              </div>
            </div>
          </DetailSection>

          <Separator />

          {/* Documentos */}
          <DetailSection title="Documentos">
            <DocumentosCarga
              documentos={matricula.documentos}
              onUpload={handleUploadDoc}
              isUploading={uploadDocumento.isPending}
              compact
            />
          </DetailSection>

          <Separator />

          {/* Firma Digital */}
          <DetailSection title="Firma Digital">
            {matricula.firmaCapturada && matricula.firmaBase64 ? (
              <FirmaCaptura firmaExistente={matricula.firmaBase64} onGuardar={() => {}} />
            ) : (
              <Button variant="outline" size="sm" className="w-full" onClick={() => setFirmaDialogOpen(true)}>
                <PenTool className="h-4 w-4 mr-2" />
                Capturar Firma
              </Button>
            )}
          </DetailSection>

          <Separator />

          {/* Autorización de Datos */}
          <DetailSection title="Autorización de Datos">
            <div className="flex items-center gap-2 text-sm">
              {matricula.autorizacionDatos ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Autorización concedida</span>
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Pendiente de autorización</span>
                </>
              )}
            </div>
          </DetailSection>

          <Separator />

          {/* Checklist */}
          <DetailSection title="Checklist de Requisitos">
            <div className="space-y-3">
              <ChecklistItem label="Consentimiento de salud" completed={matricula.consentimientoSalud} icon={HeartPulse} />
              <ChecklistItem label="Firma capturada" completed={matricula.firmaCapturada} icon={PenTool} />
              <ChecklistItem
                label="Documentos verificados"
                completed={matricula.documentos.every((d) => d.estado === "verificado")}
                icon={FileText}
                sublabel={`${matricula.documentos.filter((d) => d.estado === "verificado").length}/${matricula.documentos.length} documentos`}
              />
              <ChecklistItem label="Evaluación completada" completed={matricula.evaluacionCompletada} icon={ClipboardList}
                sublabel={matricula.evaluacionPuntaje ? `Puntaje: ${matricula.evaluacionPuntaje}%` : undefined}
              />
              <ChecklistItem label="Encuesta completada" completed={matricula.encuestaCompletada} icon={FileCheck} />
            </div>
          </DetailSection>

          <Separator />

          {/* Cobros / Cartera */}
          <DetailSection title="Cobros / Cartera">
            <div className="space-y-3">
              {getValue("tipoVinculacion") === 'empresa' && (
                <div className="grid grid-cols-2 gap-3">
                  <EditableField
                    label="Contacto cobro"
                    value={getValue("cobroContactoNombre") || ""}
                    onChange={(v) => handleFieldChange("cobroContactoNombre", v)}
                  />
                  <EditableField
                    label="Celular contacto"
                    value={getValue("cobroContactoCelular") || ""}
                    onChange={(v) => handleFieldChange("cobroContactoCelular", v)}
                    icon={Phone}
                  />
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <EditableField
                  label="Valor cupo"
                  value={String(getValue("valorCupo") ?? "")}
                  onChange={(v) => handleFieldChange("valorCupo", v ? Number(v) : 0)}
                  icon={Wallet}
                />
                <EditableField
                  label="Abono"
                  value={String(getValue("abono") ?? "")}
                  onChange={(v) => handleFieldChange("abono", v ? Number(v) : 0)}
                  icon={Wallet}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Saldo</span>
                  </div>
                  <p className={`text-sm font-medium ${((getValue("valorCupo") as number ?? 0) - (getValue("abono") as number ?? 0)) > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                    ${(((getValue("valorCupo") as number) ?? 0) - ((getValue("abono") as number) ?? 0)).toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <EditableField
                  label="Fecha facturación"
                  value={getValue("fechaFacturacion") || ""}
                  onChange={(v) => handleFieldChange("fechaFacturacion", v)}
                  type="date"
                  icon={Calendar}
                />
                <EditableField
                  label="No. CTA-FACT"
                  value={getValue("ctaFactNumero") || ""}
                  onChange={(v) => handleFieldChange("ctaFactNumero", v)}
                  icon={Receipt}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <EditableField
                  label="Titular"
                  value={getValue("ctaFactTitular") || ""}
                  onChange={(v) => handleFieldChange("ctaFactTitular", v)}
                />
                <EditableField
                  label="Forma de pago"
                  value={getValue("formaPago") || ""}
                  displayValue={getValue("formaPago") ? FORMA_PAGO_LABELS[getValue("formaPago")!] : undefined}
                  onChange={(v) => handleFieldChange("formaPago", v)}
                  type="select"
                  options={[...FORMAS_PAGO]}
                  icon={CreditCard}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <EditableField
                  label="Fecha de pago"
                  value={getValue("fechaPago") || ""}
                  onChange={(v) => handleFieldChange("fechaPago", v)}
                  type="date"
                  icon={Calendar}
                />
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Estado</span>
                  <Badge variant={matricula.pagado ? "default" : "secondary"} className={matricula.pagado ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}>
                    {matricula.pagado ? "Pagado" : "Pendiente"}
                  </Badge>
                </div>
              </div>
            </div>
          </DetailSection>

          <Separator />

          {/* Certificado */}
          <DetailSection title="Certificado">
            <div className="grid grid-cols-2 gap-3">
              <EditableField
                label="Fecha generación"
                value={getValue("fechaGeneracionCertificado") || ""}
                onChange={(v) => handleFieldChange("fechaGeneracionCertificado", v)}
                type="date"
                icon={Award}
              />
              <EditableField
                label="Fecha entrega"
                value={getValue("fechaEntregaCertificado") || ""}
                onChange={(v) => handleFieldChange("fechaEntregaCertificado", v)}
                type="date"
                icon={Calendar}
              />
            </div>
          </DetailSection>

          <Separator />

          {/* Observaciones */}
          <DetailSection title="Observaciones">
            <EditableField
              label=""
              value={getValue("observaciones") || ""}
              onChange={(v) => handleFieldChange("observaciones", v)}
              type="text"
              icon={MessageSquareText}
            />
          </DetailSection>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground pt-4">
            <p>Creada: {format(new Date(matricula.createdAt), "d MMM yyyy, HH:mm", { locale: es })}</p>
            <p>Actualizada: {format(new Date(matricula.updatedAt), "d MMM yyyy, HH:mm", { locale: es })}</p>
          </div>
        </div>
      </DetailSheet>

      {/* Firma Dialog */}
      <Dialog open={firmaDialogOpen} onOpenChange={setFirmaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Capturar Firma</DialogTitle>
          </DialogHeader>
          <FirmaCaptura onGuardar={handleCapturarFirma} isPending={capturarFirma.isPending} />
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ChecklistItemProps {
  label: string;
  completed: boolean;
  icon: React.ElementType;
  sublabel?: string;
}

function ChecklistItem({ label, completed, icon: Icon, sublabel }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${completed ? "bg-emerald-500/10" : "bg-muted"}`}>
        {completed ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div>
        <p className={`text-sm ${completed ? "text-foreground" : "text-muted-foreground"}`}>{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      </div>
    </div>
  );
}
