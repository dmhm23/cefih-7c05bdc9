import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  BookOpen,
  
  CreditCard,
  Calendar,
  CheckCircle2,
  Circle,
  FileText,
  ClipboardList,
  Receipt,
  Building2,
  GraduationCap,
  Briefcase,
  Check,
  X,
  Wallet,
  Award,
  Mail,
  Phone,
  UserCircle,
  Droplet,
  Globe,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { DetailSheet, DetailSection } from "@/components/shared/DetailSheet";
import { EditableField } from "@/components/shared/EditableField";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useToast } from "@/hooks/use-toast";
import { useUpdateMatricula, useRegistrarPago, useUploadDocumento, useUpdateDocumento, useMatricula, useUploadConsolidado } from "@/hooks/useMatriculas";
import { sincronizarDocumentos } from "@/services/documentoService";
import { usePersonas, useUpdatePersona } from "@/hooks/usePersonas";
import { useCursos } from "@/hooks/useCursos";
import { useFormatosMatricula } from "@/hooks/useFormatosFormacion";
import { resolveFormatoEstado } from "@/utils/resolveFormatoEstado";
import { useFormatoRespuestas, useReopenFormatoRespuesta } from "@/hooks/useFormatoRespuestas";
import { useAuth } from "@/contexts/AuthContext";
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { PersonaFormData } from "@/types/persona";
import {
  Matricula,
  NIVEL_PREVIO_LABELS, TIPO_VINCULACION_LABELS, FORMA_PAGO_LABELS, FormaPago,
} from "@/types/matricula";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { fmtDateLocal } from "@/utils/dateUtils";
import { DocumentosCarga } from "@/components/matriculas/DocumentosCarga";
import FormatosList from "@/components/matriculas/formatos/FormatosList";
import { ComentariosSection } from "@/components/shared/ComentariosSection";
import DynamicFormatoPreviewDialog from "@/components/matriculas/formatos/DynamicFormatoPreviewDialog";
import { FormatoFormacion } from "@/modules/formatos/plugins/safa";
import {
  AREAS_TRABAJO,
  SECTORES_ECONOMICOS,
  TIPOS_DOCUMENTO,
  GENEROS,
  NIVELES_EDUCATIVOS,
  GRUPOS_SANGUINEOS,
  PAISES,
  TIPOS_VINCULACION,
  FORMAS_PAGO,
  NIVELES_PREVIOS,
  EPS_OPTIONS,
  ARL_OPTIONS,
} from "@/data/formOptions";
import { useResolveNivel } from "@/hooks/useResolveNivel";
import { useNivelesFormacion } from "@/hooks/useNivelesFormacion";

type PreviewFormatoId = string | null;



interface MatriculaDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matricula: Matricula | null;
  currentIndex: number;
  totalCount: number;
  onNavigate: (direction: "prev" | "next") => void;
}



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
  const { logActivity } = useActivityLogger();
  const { user } = useAuth();
  const updateMatricula = useUpdateMatricula();
  const reopenMutation = useReopenFormatoRespuesta();
  const registrarPago = useRegistrarPago();
  const uploadDocumento = useUploadDocumento();
  const uploadConsolidado = useUploadConsolidado();
  const updateDocumento = useUpdateDocumento();
  const { data: personas = [] } = usePersonas();
  const { data: cursos = [] } = useCursos();
  const updatePersona = useUpdatePersona();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [personaFormData, setPersonaFormData] = useState<Partial<PersonaFormData>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isPersonaDirty, setIsPersonaDirty] = useState(false);
  const [previewFormato, setPreviewFormato] = useState<PreviewFormatoId>(null);
  const [dynamicFormato, setDynamicFormato] = useState<FormatoFormacion | null>(null);

  // Fetch individual matricula to get documents
  const { data: fullMatricula, refetch: refetchMatricula } = useMatricula(matricula?.id || "");

  const persona = matricula ? personas.find((p) => p.id === matricula.personaId) : undefined;
  const curso = matricula ? cursos.find((c) => c.id === matricula.cursoId) : undefined;
  const { data: formatosDinamicos } = useFormatosMatricula(matricula?.id);
  const { data: respuestas = [] } = useFormatoRespuestas(matricula?.id);
  const { data: nivelesFormacion = [] } = useNivelesFormacion();
  const resolveNivel = useResolveNivel();
  const nivelesOptions = nivelesFormacion.map((n) => ({ value: n.id, label: n.nombreNivel }));

  // Sync document requirements
  const [docsSynced, setDocsSynced] = useState(false);
  const [lastSyncedNivel, setLastSyncedNivel] = useState<string | undefined>();
  const syncingRef = useRef(false);
  useEffect(() => {
    if (!matricula?.id || !open || syncingRef.current) return;
    const nivelId = matricula.nivelFormacionId;
    if (docsSynced && nivelId === lastSyncedNivel) return;
    syncingRef.current = true;
    sincronizarDocumentos(matricula.id, nivelId)
      .then(({ huboCambios }) => {
        setDocsSynced(true);
        setLastSyncedNivel(nivelId);
        if (huboCambios) refetchMatricula();
      })
      .catch(() => {
        setDocsSynced(true);
        setLastSyncedNivel(nivelId);
      })
      .finally(() => { syncingRef.current = false; });
  }, [matricula?.id, matricula?.nivelFormacionId, docsSynced, lastSyncedNivel, open, refetchMatricula]);

  useEffect(() => {
    setFormData({});
    setPersonaFormData({});
    setIsDirty(false);
    setIsPersonaDirty(false);
    setPreviewFormato(null);
    setDynamicFormato(null);
    setDocsSynced(false);
    setLastSyncedNivel(undefined);
  }, [matricula?.id]);

  useEffect(() => {
    if (!open) { setPreviewFormato(null); setDynamicFormato(null); }
  }, [open]);

  if (!matricula) return null;
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
      if (isPersonaDirty && persona) {
        await updatePersona.mutateAsync({ id: persona.id, data: personaFormData });
      }
      const otherChanges = { ...formData };
      delete otherChanges.estado;
      if (Object.keys(otherChanges).length > 0) {
        await updateMatricula.mutateAsync({ id: matricula.id, data: otherChanges });
      }
      toast({ title: "Cambios guardados correctamente" });
      logActivity({ action: "editar", module: "matriculas", description: `Guardó cambios en matrícula de ${persona?.nombres || ""} ${persona?.apellidos || ""}`, entityType: "matricula", entityId: matricula.id, metadata: { campos_matricula: Object.keys(otherChanges), campos_persona: isPersonaDirty ? Object.keys(personaFormData) : [] } });
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
      logActivity({ action: "crear", module: "matriculas", description: `Registró pago en matrícula de ${persona?.nombres || ""} ${persona?.apellidos || ""}`, entityType: "matricula", entityId: matricula.id });
    } catch (error) {
      toast({ title: "Error al registrar pago", variant: "destructive" });
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
      logActivity({ action: "subir", module: "matriculas", description: `Subió documento "${file.name}" a matrícula de ${persona?.nombres || ""} ${persona?.apellidos || ""}`, entityType: "matricula", entityId: matricula.id, metadata: { archivo: file.name, tamano: file.size, documento_id: documentoId } });
    } catch (error) {
      toast({ title: "Error al cargar documento", variant: "destructive" });
    }
  };

  const handleUploadConsolidado = async (file: File, documentosIds: string[], tiposIncluidos: string[]) => {
    try {
      await uploadConsolidado.mutateAsync({
        matriculaId: matricula.id,
        file,
        documentosIds,
        tiposIncluidos,
        metadata: {
          cursoId: matricula.cursoId,
          personaNombre: persona ? `${persona.nombres} ${persona.apellidos}` : undefined,
          personaCedula: persona?.numeroDocumento,
        },
      });
      toast({ title: `PDF consolidado cargado (${documentosIds.length} requisitos)` });
      logActivity({ action: "subir", module: "matriculas", description: `Subió PDF consolidado "${file.name}" cubriendo ${documentosIds.length} requisitos`, entityType: "matricula", entityId: matricula.id, metadata: { archivo: file.name, tamano: file.size, tipos: tiposIncluidos } });
    } catch (error: any) {
      toast({ title: error?.message || "Error al cargar consolidado", variant: "destructive" });
    }
  };

  const handleDeleteDoc = async (documentoId: string) => {
    try {
      await updateDocumento.mutateAsync({
        matriculaId: matricula.id,
        documentoId,
        data: { estado: 'pendiente', fechaCarga: undefined, urlDrive: undefined, archivoNombre: undefined, archivoTamano: undefined } as any,
      });
      toast({ title: "Documento eliminado" });
      logActivity({ action: "eliminar", module: "matriculas", description: `Eliminó documento de matrícula de ${persona?.nombres || ""} ${persona?.apellidos || ""}`, entityType: "matricula", entityId: matricula.id, metadata: { documento_id: documentoId } });
    } catch {
      toast({ title: "Error al eliminar documento", variant: "destructive" });
    }
  };

  const handleDocFechaChange = async (documentoId: string, field: string, value: string) => {
    try {
      await updateDocumento.mutateAsync({ matriculaId: matricula.id, documentoId, data: { [field]: value } as any });
    } catch {
      toast({ title: "Error al actualizar fecha", variant: "destructive" });
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


  const personaName = persona ? `${persona.nombres} ${persona.apellidos}` : "N/A";
  const personaDoc = persona?.numeroDocumento || "";
  const cursoName = curso?.nombre || "Sin curso asignado";
  const nivelFormacionLabel = matricula.nivelFormacionId 
    ? resolveNivel(matricula.nivelFormacionId) 
    : undefined;

  const handleFullScreen = () => {
    if (matricula) { onOpenChange(false); navigate(`/matriculas/${matricula.id}`); }
  };

  return (
    <>
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={personaName}
      subtitle={nivelFormacionLabel}
      currentIndex={currentIndex}
      totalCount={totalCount}
      onNavigate={onNavigate}
      onFullScreen={handleFullScreen}
      countLabel="matrículas"
      footer={
        (isDirty || isPersonaDirty) ? (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
            <Button onClick={handleSave} disabled={updateMatricula.isPending || updatePersona.isPending}>
              {updateMatricula.isPending || updatePersona.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-6">

        {/* Estudiante */}
        <DetailSection title="Estudiante">
          {persona ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <EditableField label="Nombres" value={getPersonaValue("nombres") as string} onChange={(v) => handlePersonaFieldChange("nombres", v)} icon={User} />
                <EditableField label="Apellidos" value={getPersonaValue("apellidos") as string} onChange={(v) => handlePersonaFieldChange("apellidos", v)} icon={User} />
                <EditableField label="Tipo Doc." value={getPersonaValue("tipoDocumento") as string} displayValue={getDisplayLabel(getPersonaValue("tipoDocumento") as string, TIPOS_DOCUMENTO)} onChange={(v) => handlePersonaFieldChange("tipoDocumento", v)} type="select" options={[...TIPOS_DOCUMENTO]} icon={FileText} badge />
                <EditableField label="No. Documento" value={getPersonaValue("numeroDocumento") as string} onChange={(v) => handlePersonaFieldChange("numeroDocumento", v)} icon={FileText} />
                <EditableField label="Email" value={getPersonaValue("email") as string} onChange={(v) => handlePersonaFieldChange("email", v)} icon={Mail} />
                <EditableField label="Teléfono" value={getPersonaValue("telefono") as string} onChange={(v) => handlePersonaFieldChange("telefono", v)} icon={Phone} />
                <EditableField label="Género" value={getPersonaValue("genero") as string} displayValue={getDisplayLabel(getPersonaValue("genero") as string, GENEROS)} onChange={(v) => handlePersonaFieldChange("genero", v)} type="select" options={[...GENEROS]} icon={UserCircle} badge />
                <EditableField label="Fecha Nacimiento" value={getPersonaValue("fechaNacimiento") as string} onChange={(v) => handlePersonaFieldChange("fechaNacimiento", v)} type="date" icon={Calendar} />
                <EditableField label="RH" value={getPersonaValue("rh") as string} displayValue={getDisplayLabel(getPersonaValue("rh") as string, GRUPOS_SANGUINEOS)} onChange={(v) => handlePersonaFieldChange("rh", v)} type="select" options={[...GRUPOS_SANGUINEOS]} icon={Droplet} badge badgeVariant="outline" />
                <EditableField label="Nivel Educativo" value={getPersonaValue("nivelEducativo") as string} displayValue={getDisplayLabel(getPersonaValue("nivelEducativo") as string, NIVELES_EDUCATIVOS)} onChange={(v) => handlePersonaFieldChange("nivelEducativo", v)} type="select" options={[...NIVELES_EDUCATIVOS]} icon={GraduationCap} />
                <EditableField label="País Nacimiento" value={getPersonaValue("paisNacimiento") as string} displayValue={getDisplayLabel(getPersonaValue("paisNacimiento") as string, PAISES)} onChange={(v) => handlePersonaFieldChange("paisNacimiento", v)} type="select" options={[...PAISES]} icon={Globe} />
              </div>
              {/* Contacto de Emergencia */}
              <div className="pt-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Contacto de Emergencia</p>
                <div className="grid grid-cols-2 gap-4">
                  <EditableField label="Nombre" value={(getPersonaValue("contactoEmergencia") as any)?.nombre ?? ""} onChange={(v) => handlePersonaNestedFieldChange("contactoEmergencia", "nombre", v)} icon={AlertCircle} />
                  <EditableField label="Teléfono" value={(getPersonaValue("contactoEmergencia") as any)?.telefono ?? ""} onChange={(v) => handlePersonaNestedFieldChange("contactoEmergencia", "telefono", v)} icon={Phone} />
                  <EditableField label="Parentesco" value={(getPersonaValue("contactoEmergencia") as any)?.parentesco ?? ""} onChange={(v) => handlePersonaNestedFieldChange("contactoEmergencia", "parentesco", v)} />
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
          {curso ? (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{curso.nombre}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Fecha inicio</p>
                  <p>{fmtDateLocal(curso.fechaInicio, "d MMM yyyy")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha fin</p>
                  <p>{fmtDateLocal(curso.fechaFin, "d MMM yyyy")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duración</p>
                  <p>{curso.horasTotales}h ({curso.duracionDias} días)</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Entrenador</p>
                  <p>{curso.entrenadorNombre}</p>
                </div>
              </div>
              <Button
                variant="link"
                size="sm"
                className="px-0 gap-1 h-auto text-xs"
                onClick={() => { onOpenChange(false); navigate(`/cursos/${curso.id}`); }}
              >
                <ExternalLink className="h-3 w-3" />
                Ver curso
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin curso asignado</p>
          )}
        </DetailSection>

        <Separator />

        {/* Historial de Formación Previa */}
        {(matricula.nivelPrevio || matricula.centroFormacionPrevio) && (
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
              </div>
            </DetailSection>
            <Separator />
          </>
        )}

        {/* Vinculación Laboral */}
        <DetailSection title="Vinculación Laboral">
          <div className="grid grid-cols-2 gap-4">
            <EditableField
              label="Responsable del pago"
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
              value={getValue("nivelFormacionId") || ""}
              displayValue={getValue("nivelFormacionId") ? resolveNivel(getValue("nivelFormacionId") as string) : undefined}
              onChange={(v) => handleFieldChange("nivelFormacionId", v)}
              type="select"
              options={nivelesOptions}
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
            <EditableField
              label="EPS"
              value={getValue("eps") || ""}
              displayValue={getDisplayLabel(getValue("eps") || "", EPS_OPTIONS)}
              onChange={(v) => handleFieldChange("eps", v)}
              type="select"
              options={[...EPS_OPTIONS]}
            />
            {getValue("eps") === "otra_eps" && (
              <EditableField
                label="Nombre EPS"
                value={getValue("epsOtra") || ""}
                onChange={(v) => handleFieldChange("epsOtra", v)}
                placeholder="Escriba el nombre de la EPS..."
              />
            )}
            <EditableField
              label="ARL"
              value={getValue("arl") || ""}
              displayValue={getDisplayLabel(getValue("arl") || "", ARL_OPTIONS)}
              onChange={(v) => handleFieldChange("arl", v)}
              type="select"
              options={[...ARL_OPTIONS]}
            />
            {getValue("arl") === "otra_arl" && (
              <EditableField
                label="Nombre ARL"
                value={getValue("arlOtra") || ""}
                onChange={(v) => handleFieldChange("arlOtra", v)}
                placeholder="Escriba el nombre de la ARL..."
              />
            )}
            {(getValue("tipoVinculacion") === 'empresa' || getValue("tipoVinculacion") === 'independiente' || getValue("tipoVinculacion") === 'arl') && (
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
                <EditableField
                  label="Representante Legal"
                  value={getValue("empresaRepresentanteLegal") || ""}
                  onChange={(v) => handleFieldChange("empresaRepresentanteLegal", v)}
                />
                {matricula.empresaId && (
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 gap-1 h-auto text-xs col-span-2"
                    onClick={() => { onOpenChange(false); navigate(`/empresas/${matricula.empresaId}`); }}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver empresa en directorio
                  </Button>
                )}
              </>
            )}
            {(getValue("tipoVinculacion") === 'empresa' || getValue("tipoVinculacion") === 'arl') && (
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

        {/* Documentos */}
        <DetailSection title="Requisitos documentales">
          <DocumentosCarga
            documentos={fullMatricula?.documentos || matricula.documentos}
            onUpload={handleUploadDoc}
            onDelete={handleDeleteDoc}
            onUploadConsolidado={handleUploadConsolidado}
            onFechaChange={handleDocFechaChange}
            isUploading={uploadDocumento.isPending || uploadConsolidado.isPending}
            compact
          />
        </DetailSection>

        <Separator />

        {/* Formatos para Formación */}
        <DetailSection title="Formatos para Formación">
          <FormatosList
            formatos={(formatosDinamicos ?? []).map((f) => ({
              id: f.id,
              nombre: f.nombre,
              codigo: f.codigo,
              estado: resolveFormatoEstado(f, respuestas),
              estadoRespuesta: resolveFormatoEstado(f, respuestas),
              esAutomatico: f.esAutomatico,
            }))}
            onPreview={(id) => {
              const fmt = formatosDinamicos?.find((f) => f.id === id);
              if (fmt) { setDynamicFormato(fmt); }
            }}
            onDownload={(id) => {
              const fmt = formatosDinamicos?.find((f) => f.id === id);
              if (fmt) { setDynamicFormato(fmt); }
            }}
            onReopen={(formatoId) => {
              const resp = respuestas.find(r => r.formatoId === formatoId);
              if (resp && user?.id) {
                reopenMutation.mutate(
                  { respuestaId: resp.id, userId: user.id },
                  {
                    onSuccess: () => { toast({ title: 'Formato reabierto' }); logActivity({ action: "reabrir", module: "formatos", description: `Reabrió formato para matrícula`, entityType: "formato_formacion", entityId: formatoId, metadata: { matricula_id: matricula.id } }); },
                    onError: (e: any) => toast({ title: 'Error', description: e?.message, variant: 'destructive' }),
                  }
                );
              }
            }}
          />
        </DetailSection>

        <Separator />

        {/* Cobros / Cartera */}
        <DetailSection title="Cobros / Cartera">
          <div className="space-y-3">
            {(getValue("tipoVinculacion") === 'empresa' || getValue("tipoVinculacion") === 'arl') && (
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
                displayValue={getValue("formaPago") ? FORMA_PAGO_LABELS[getValue("formaPago")!] || getValue("formaPago") as string : undefined}
                onChange={(v) => handleFieldChange("formaPago", v)}
                type="select"
                options={[...FORMAS_PAGO]}
                icon={CreditCard}
              />
            </div>
            {getValue("formaPago") === "otro" && (
              <EditableField
                label="Método de pago personalizado"
                value={(formData["formaPagoOtro"] as string) || ""}
                onChange={(v) => handleFieldChange("formaPagoOtro", v)}
                placeholder="Escriba el método de pago..."
              />
            )}
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
          <ComentariosSection
            entidadId={matricula.id}
            seccion="observaciones"
            titulo="Observaciones"
          />
        </DetailSection>

        {/* Metadata */}
        <div className="text-xs text-muted-foreground pt-4">
          <p>Creada: {format(new Date(matricula.createdAt), "d MMM yyyy, HH:mm", { locale: es })}</p>
          <p>Actualizada: {format(new Date(matricula.updatedAt), "d MMM yyyy, HH:mm", { locale: es })}</p>
        </div>
      </div>
    </DetailSheet>
    <DynamicFormatoPreviewDialog
      open={!!dynamicFormato}
      onOpenChange={(open) => !open && setDynamicFormato(null)}
      formato={dynamicFormato}
      persona={persona ?? null}
      matricula={matricula}
      curso={curso ?? null}
    />
    </>
  );
}
