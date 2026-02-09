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
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{cursoName}</p>
                {curso && (
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(curso.fechaInicio), "d MMM", { locale: es })} -{" "}
                    {format(new Date(curso.fechaFin), "d MMM yyyy", { locale: es })}
                  </p>
                )}
              </div>
            </div>
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
          {matricula.tipoVinculacion && (
            <>
              <DetailSection title="Vinculación Laboral">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Briefcase className="h-3 w-3" /> Tipo</p>
                    <Badge variant="outline">{TIPO_VINCULACION_LABELS[matricula.tipoVinculacion]}</Badge>
                  </div>
                  {matricula.empresaCargo && (
                    <div>
                      <p className="text-xs text-muted-foreground">Cargo</p>
                      <p className="text-sm font-medium">{matricula.empresaCargo}</p>
                    </div>
                  )}
                  {matricula.empresaNivelFormacion && (
                    <div>
                      <p className="text-xs text-muted-foreground">Nivel</p>
                      <p className="text-sm font-medium">{NIVEL_FORMACION_EMPRESA_LABELS[matricula.empresaNivelFormacion]}</p>
                    </div>
                  )}
                  {matricula.areaTrabajo && (
                    <div>
                      <p className="text-xs text-muted-foreground">Área de Trabajo</p>
                      <p className="text-sm font-medium">{getDisplayLabel(matricula.areaTrabajo, AREAS_TRABAJO)}</p>
                    </div>
                  )}
                  {matricula.sectorEconomico && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" /> Sector Económico</p>
                      <p className="text-sm font-medium">{getDisplayLabel(matricula.sectorEconomico, SECTORES_ECONOMICOS)}</p>
                    </div>
                  )}
                  {matricula.tipoVinculacion === 'empresa' && matricula.empresaNombre && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground">Empresa</p>
                        <p className="text-sm font-medium">{matricula.empresaNombre}</p>
                      </div>
                      {matricula.empresaNit && (
                        <div>
                          <p className="text-xs text-muted-foreground">NIT</p>
                          <p className="text-sm font-medium">{matricula.empresaNit}</p>
                        </div>
                      )}
                      {matricula.empresaContactoNombre && (
                        <div>
                          <p className="text-xs text-muted-foreground">Contacto</p>
                          <p className="text-sm font-medium">{matricula.empresaContactoNombre}</p>
                          {matricula.empresaContactoTelefono && (
                            <p className="text-xs text-muted-foreground">{matricula.empresaContactoTelefono}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </DetailSection>
              <Separator />
            </>
          )}

          {/* Consentimiento de Salud */}
          <DetailSection title="Consentimiento de Salud">
            {matricula.consentimientoSalud ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <ConsentIcon value={!matricula.restriccionMedica} />
                  <span>Restricción médica: {matricula.restriccionMedica ? matricula.restriccionMedicaDetalle || 'Sí' : 'No'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <ConsentIcon value={!matricula.alergias} />
                  <span>Alergias: {matricula.alergias ? matricula.alergiasDetalle || 'Sí' : 'No'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <ConsentIcon value={!matricula.consumoMedicamentos} />
                  <span>Medicamentos: {matricula.consumoMedicamentos ? matricula.consumoMedicamentosDetalle || 'Sí' : 'No'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <ConsentIcon value={matricula.nivelLectoescritura} />
                  <span>Lectoescritura: {matricula.nivelLectoescritura ? 'Sí' : 'No'}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Consentimiento pendiente</span>
              </div>
            )}
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
              {matricula.tipoVinculacion === 'empresa' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Contacto cobro</p>
                    <p className="text-sm font-medium">{matricula.cobroContactoNombre || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Celular contacto</p>
                    <p className="text-sm font-medium">{matricula.cobroContactoCelular || '—'}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Valor cupo</p>
                  <p className="text-sm font-medium">{matricula.valorCupo ? `$${matricula.valorCupo.toLocaleString('es-CO')}` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Abono</p>
                  <p className="text-sm font-medium">{matricula.abono ? `$${matricula.abono.toLocaleString('es-CO')}` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p className={`text-sm font-medium ${(matricula.valorCupo ?? 0) - (matricula.abono ?? 0) > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                    ${((matricula.valorCupo ?? 0) - (matricula.abono ?? 0)).toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Fecha facturación</p>
                  <p className="text-sm font-medium">{matricula.fechaFacturacion || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">No. CTA-FACT</p>
                  <p className="text-sm font-medium">{matricula.ctaFactNumero || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Titular</p>
                  <p className="text-sm font-medium">{matricula.ctaFactTitular || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Forma de pago</p>
                  <p className="text-sm font-medium">{matricula.formaPago ? FORMA_PAGO_LABELS[matricula.formaPago] : '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Fecha de pago</p>
                  <p className="text-sm font-medium">{matricula.fechaPago ? format(new Date(matricula.fechaPago), "d MMM yyyy", { locale: es }) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <Badge variant={matricula.pagado ? "default" : "secondary"} className={matricula.pagado ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}>
                    {matricula.pagado ? "Pagado" : "Pendiente"}
                  </Badge>
                </div>
              </div>
              {!matricula.pagado && (
                <Button variant="outline" size="sm" className="w-full" onClick={handleRegistrarPago} disabled={registrarPago.isPending}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {registrarPago.isPending ? "Registrando..." : "Registrar Pago"}
                </Button>
              )}
            </div>
          </DetailSection>

          <Separator />

          {/* Certificado */}
          <DetailSection title="Certificado">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Award className="h-3 w-3" /> Fecha generación</p>
                <p className="text-sm font-medium">{matricula.fechaGeneracionCertificado ? format(new Date(matricula.fechaGeneracionCertificado), "d MMM yyyy", { locale: es }) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha entrega</p>
                <EditableField
                  label=""
                  value={getValue("fechaEntregaCertificado") || ""}
                  onChange={(v) => handleFieldChange("fechaEntregaCertificado", v)}
                  type="date"
                />
              </div>
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
