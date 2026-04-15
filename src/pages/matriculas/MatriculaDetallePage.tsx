import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CreditCard, ExternalLink, RefreshCw } from "lucide-react";
import { CertificacionSection } from "@/components/matriculas/CertificacionSection";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EditableField } from "@/components/shared/EditableField";
import { useMatricula, useUpdateMatricula, useUpdateDocumento, useRegistrarPago, useCambiarEstadoMatricula, useUploadDocumento } from "@/hooks/useMatriculas";
import { sincronizarDocumentos } from "@/services/documentoService";
import { useEmpresas } from "@/hooks/useEmpresas";
import { usePersona, useUpdatePersona } from "@/hooks/usePersonas";
import { PersonaFormData } from "@/types/persona";
import { useCurso } from "@/hooks/useCursos";
import { useFormatosMatricula } from "@/hooks/useFormatosFormacion";
import { resolveFormatoEstado } from "@/utils/resolveFormatoEstado";
import { useFormatoRespuestas } from "@/hooks/useFormatoRespuestas";
import { FORMA_PAGO_LABELS } from "@/types";
import { Matricula } from "@/types/matricula";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { fmtDateLocal } from "@/utils/dateUtils";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentosCarga } from "@/components/matriculas/DocumentosCarga";
import FormatosList from "@/components/matriculas/formatos/FormatosList";
import { ComentariosSection } from "@/components/shared/ComentariosSection";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import DynamicFormatoPreviewDialog from "@/components/matriculas/formatos/DynamicFormatoPreviewDialog";
import { FormatoFormacion } from "@/types/formatoFormacion";
import {
  TIPOS_VINCULACION,
  AREAS_TRABAJO,
  SECTORES_ECONOMICOS,
  NIVELES_PREVIOS,
  FORMAS_PAGO,
  EPS_OPTIONS,
  ARL_OPTIONS,
  TIPOS_DOCUMENTO,
  GENEROS,
  NIVELES_EDUCATIVOS,
  GRUPOS_SANGUINEOS,
  PAISES,
} from "@/data/formOptions";
import { useResolveNivel } from "@/hooks/useResolveNivel";
import { useNivelesFormacion } from "@/hooks/useNivelesFormacion";
import { asignarMatriculaACartera } from "@/services/carteraService";
import { supabase } from "@/integrations/supabase/client";
import { useCodigosCurso } from "@/hooks/useCodigosCurso";
import type { TipoResponsable } from "@/types/cartera";

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  action?: () => void;
}

type PreviewFormatoId = string | null;



export default function MatriculaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string })?.from || "/matriculas";
  const { toast } = useToast();
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false);
  const [facturaNumero, setFacturaNumero] = useState("");
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [previewFormato, setPreviewFormato] = useState<PreviewFormatoId>(null);
  const [dynamicFormato, setDynamicFormato] = useState<FormatoFormacion | null>(null);
  const [personaFormData, setPersonaFormData] = useState<Partial<PersonaFormData>>({});
  const [isPersonaDirty, setIsPersonaDirty] = useState(false);

  const { data: matricula, isLoading, refetch: refetchMatricula } = useMatricula(id || "");
  const { data: persona } = usePersona(matricula?.personaId || "");
  const { data: curso } = useCurso(matricula?.cursoId || "");
  const { data: formatosDinamicos } = useFormatosMatricula(id);
  const { data: respuestas = [] } = useFormatoRespuestas(id);
  const updateMatricula = useUpdateMatricula();
  const updateDocumento = useUpdateDocumento();
  const registrarPago = useRegistrarPago();
  const cambiarEstado = useCambiarEstadoMatricula();
  const uploadDocumento = useUploadDocumento();
  const updatePersona = useUpdatePersona();
  const { data: nivelesFormacion = [] } = useNivelesFormacion();
  const nivelesOptions = nivelesFormacion.map((n) => ({ value: n.id, label: n.nombreNivel }));
  const { data: empresasList = [] } = useEmpresas();
  const empresasOptions = empresasList.map((e) => ({ value: e.id, label: e.nombreEmpresa }));
  const { codigos: codigosCurso } = useCodigosCurso(curso);
  const codigoEstudiante = matricula ? (codigosCurso[matricula.id] ?? null) : null;
  const [hasGrupoCartera, setHasGrupoCartera] = useState<boolean | null>(null);
  const [syncingCartera, setSyncingCartera] = useState(false);

  useEffect(() => {
    if (!matricula?.id) return;
    supabase
      .from('grupo_cartera_matriculas')
      .select('grupo_cartera_id')
      .eq('matricula_id', matricula.id)
      .maybeSingle()
      .then(({ data }) => setHasGrupoCartera(!!data));
  }, [matricula?.id]);

  // Sync document requirements: create missing docs for existing enrollments
  const [docsSynced, setDocsSynced] = useState(false);
  const [lastSyncedNivel, setLastSyncedNivel] = useState<string | undefined>();
  useEffect(() => {
    if (!matricula?.id) return;
    const nivelId = matricula.nivelFormacionId;
    // Re-sync if not yet synced OR if the nivel changed since last sync
    if (docsSynced && nivelId === lastSyncedNivel) return;
    sincronizarDocumentos(matricula.id, nivelId)
      .then(({ huboCambios }) => {
        setDocsSynced(true);
        setLastSyncedNivel(nivelId);
        if (huboCambios) refetchMatricula();
      })
      .catch(() => {
        setDocsSynced(true);
        setLastSyncedNivel(nivelId);
      });
  }, [matricula?.id, matricula?.nivelFormacionId, docsSynced, lastSyncedNivel, refetchMatricula]);

  const handleSyncCartera = async () => {
    if (!matricula || !id) return;
    setSyncingCartera(true);
    try {
      const tipoResp: TipoResponsable =
        (matricula.tipoVinculacion === 'empresa' || matricula.tipoVinculacion === 'arl')
          ? matricula.tipoVinculacion as TipoResponsable
          : 'independiente';
      await asignarMatriculaACartera({
        matriculaId: id,
        valorCupo: matricula.valorCupo || 0,
        tipoVinculacion: tipoResp,
        empresaNombre: matricula.empresaNombre,
        empresaNit: matricula.empresaNit,
        empresaId: matricula.empresaId,
        empresaContactoNombre: matricula.empresaContactoNombre,
        empresaContactoTelefono: matricula.empresaContactoTelefono,
        personaNombre: persona ? `${persona.nombres} ${persona.apellidos}` : undefined,
        personaDocumento: persona?.numeroDocumento,
        personaTelefono: persona?.telefono,
        personaEmail: persona?.email,
      });
      setHasGrupoCartera(true);
      toast({ title: "Matrícula vinculada a cartera correctamente" });
    } catch (e: any) {
      toast({ title: "Error al sincronizar cartera", description: e.message, variant: "destructive" });
    } finally {
      setSyncingCartera(false);
    }
  };

  useEffect(() => {
    setFormData({});
    setIsDirty(false);
    setPersonaFormData({});
    setIsPersonaDirty(false);
  }, [matricula?.id]);

  // --- Navigation protection ---
  const hasUnsavedChanges = isDirty || isPersonaDirty;
  const [pendingNavPath, setPendingNavPath] = useState<string | null>(null);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // Intercept programmatic navigation (sidebar uses navigate() which calls pushState)
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const origPush = window.history.pushState.bind(window.history);
    const origReplace = window.history.replaceState.bind(window.history);

    const intercept = (orig: typeof window.history.pushState) =>
      function (this: History, data: unknown, unused: string, url?: string | URL | null) {
        if (url && typeof url === 'string' && url !== window.location.href) {
          setPendingNavPath(url);
          return;
        }
        return orig.call(this, data, unused, url);
      };

    window.history.pushState = intercept(origPush);
    window.history.replaceState = intercept(origReplace);

    return () => {
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handlePop = () => {
      window.history.pushState(null, '', window.location.href);
      setPendingNavPath('__back__');
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [hasUnsavedChanges]);

  const handleNavDiscard = useCallback(() => {
    const path = pendingNavPath;
    setPendingNavPath(null);
    setFormData({});
    setIsDirty(false);
    setPersonaFormData({});
    setIsPersonaDirty(false);
    if (path === '__back__') window.history.back();
    else if (path) navigate(path);
  }, [pendingNavPath, navigate]);

  const handleNavSave = useCallback(async () => {
    const path = pendingNavPath;
    setPendingNavPath(null);
    try {
      if (isDirty) {
        await updateMatricula.mutateAsync({ id: matricula?.id || '', data: formData });
        setFormData({});
        setIsDirty(false);
      }
      if (isPersonaDirty && persona) {
        await updatePersona.mutateAsync({ id: persona.id, data: personaFormData });
        setPersonaFormData({});
        setIsPersonaDirty(false);
      }
      toast({ title: "Cambios guardados correctamente" });
      if (path === '__back__') window.history.back();
      else if (path) navigate(path);
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    }
  }, [pendingNavPath, isDirty, isPersonaDirty, formData, personaFormData, matricula, persona, updateMatricula, updatePersona, toast, navigate]);

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setPendingNavPath(fromPath);
    } else {
      navigate(fromPath);
    }
  };

  const handlePersonaFieldChange = (field: string, value: string) => {
    setPersonaFormData((prev) => ({ ...prev, [field]: value }));
    setIsPersonaDirty(true);
  };

  const handlePersonaNestedFieldChange = (parent: "contactoEmergencia", field: string, value: string) => {
    setPersonaFormData((prev) => {
      const existing = prev[parent] || persona?.[parent] || { nombre: "", telefono: "", parentesco: "" };
      return {
        ...prev,
        [parent]: {
          ...existing,
          [field]: value,
        },
      };
    });
    setIsPersonaDirty(true);
  };

  const getPersonaValue = (field: keyof PersonaFormData): string => {
    const val = (personaFormData[field] ?? persona?.[field]) as string | undefined;
    return val?.toString() ?? "";
  };

  const getPersonaEmergencyValue = (field: string): string => {
    const ce = personaFormData.contactoEmergencia || persona?.contactoEmergencia;
    return (ce as any)?.[field] ?? "";
  };

  const handleSavePersona = async () => {
    if (!persona) return;
    try {
      await updatePersona.mutateAsync({ id: persona.id, data: personaFormData });
      toast({ title: "Datos del estudiante actualizados" });
      setPersonaFormData({});
      setIsPersonaDirty(false);
    } catch {
      toast({ title: "Error al guardar datos del estudiante", variant: "destructive" });
    }
  };

  const handleCancelPersona = () => {
    setPersonaFormData({});
    setIsPersonaDirty(false);
  };


  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!matricula) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Matrícula no encontrada</p>
        <Button variant="link" onClick={() => navigate("/matriculas")}>
          Volver al listado
        </Button>
      </div>
    );
  }

  const handleFieldChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleMultiFieldChange = (changes: Record<string, string | number | null>) => {
    setFormData((prev) => ({ ...prev, ...changes }));
    setIsDirty(true);
  };

  const handleTipoVinculacionChange = (nuevoTipo: string) => {
    if (nuevoTipo === "independiente") {
      const nombreCompleto = persona ? `${persona.nombres} ${persona.apellidos}` : "";
      const doc = persona?.numeroDocumento || "";
      handleMultiFieldChange({
        tipoVinculacion: nuevoTipo,
        empresaNombre: nombreCompleto,
        empresaNit: doc,
        empresaId: "",
        empresaRepresentanteLegal: "",
        empresaContactoNombre: "",
        empresaContactoTelefono: "",
      });
    } else {
      handleMultiFieldChange({
        tipoVinculacion: nuevoTipo,
        empresaNombre: "",
        empresaNit: "",
        empresaId: "",
        empresaRepresentanteLegal: "",
        empresaContactoNombre: "",
        empresaContactoTelefono: "",
      });
    }
  };

  const handleEmpresaSelect = (empresaId: string) => {
    const emp = empresasList.find((e) => e.id === empresaId);
    if (!emp) return;
    const contactoPrincipal = emp.contactos?.find((c) => c.esPrincipal) || emp.contactos?.[0];
    handleMultiFieldChange({
      empresaId: emp.id,
      empresaNombre: emp.nombreEmpresa,
      empresaNit: emp.nit,
      empresaRepresentanteLegal: emp.representanteLegal || "",
      sectorEconomico: emp.sectorEconomico || "",
      arl: emp.arl || "",
      empresaContactoNombre: contactoPrincipal?.nombre || emp.personaContacto || "",
      empresaContactoTelefono: contactoPrincipal?.telefono || emp.telefonoContacto || "",
    });
  };

  const handleSave = async () => {
    try {
      await updateMatricula.mutateAsync({ id: matricula.id, data: formData });

      // Si se modificó valorCupo, recalcular el grupo de cartera asociado
      if (formData.valorCupo !== undefined) {
        const { data: link } = await supabase
          .from('grupo_cartera_matriculas')
          .select('grupo_cartera_id')
          .eq('matricula_id', matricula.id)
          .maybeSingle();
        if (link?.grupo_cartera_id) {
          await supabase.rpc('recalcular_grupo_cartera', { p_grupo_id: link.grupo_cartera_id });
        }
      }

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

  const getValue = (field: keyof Matricula): string => {
    const val = (formData[field] ?? matricula[field]) as string | number | undefined;
    return val?.toString() ?? "";
  };

  const getDisplayLabel = (value: string, options: readonly { value: string; label: string }[]) => {
    return options.find((o) => o.value === value)?.label || value;
  };

  const docsCompletos = matricula.documentos.filter((d) => d.estado !== "pendiente").length;
  const totalDocs = matricula.documentos.length;
  const checklistItems: ChecklistItem[] = [
    { id: "docs", label: `Documentos (${docsCompletos}/${totalDocs})`, completed: docsCompletos === totalDocs },
    { id: "pago", label: "Pago registrado", completed: matricula.pagado, action: () => !matricula.pagado && setPagoDialogOpen(true) },
    { id: "evaluacion", label: "Evaluación completada", completed: matricula.evaluacionCompletada },
    { id: "encuesta", label: "Encuesta de satisfacción", completed: matricula.encuestaCompletada },
  ];

  const completedItems = checklistItems.filter((item) => item.completed).length;
  const progressPercent = (completedItems / checklistItems.length) * 100;

  const handleRegistrarPago = async () => {
    if (!facturaNumero.trim()) {
      toast({ title: "Ingrese el número de factura", variant: "destructive" });
      return;
    }
    try {
      await registrarPago.mutateAsync({ id: matricula.id, datosPago: { ctaFactNumero: facturaNumero } });
      toast({ title: "Pago registrado correctamente" });
      setPagoDialogOpen(false);
      setFacturaNumero("");
    } catch {
      toast({ title: "Error al registrar pago", variant: "destructive" });
    }
  };

  const handleCambiarEstado = async (nuevoEstado: "completa" | "certificada") => {
    try {
      await cambiarEstado.mutateAsync({ id: matricula.id, estado: nuevoEstado });
      toast({ title: `Estado cambiado a ${nuevoEstado}` });
    } catch {
      toast({ title: "Error al cambiar estado", variant: "destructive" });
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
    } catch {
      toast({ title: "Error al cargar documento", variant: "destructive" });
    }
  };

  const handleDeleteDoc = async (documentoId: string) => {
    try {
      await updateDocumento.mutateAsync({
        matriculaId: matricula.id,
        documentoId,
        data: {
          estado: 'pendiente',
          fechaCarga: undefined,
          urlDrive: undefined,
          archivoNombre: undefined,
          archivoTamano: undefined,
        } as any,
      });
      toast({ title: "Documento eliminado" });
    } catch {
      toast({ title: "Error al eliminar documento", variant: "destructive" });
    }
  };

  const handleDocFechaChange = async (documentoId: string, field: string, value: string) => {
    try {
      await updateDocumento.mutateAsync({
        matriculaId: matricula.id,
        documentoId,
        data: { [field]: value } as any,
      });
    } catch {
      toast({ title: "Error al actualizar fecha", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header compacto */}
      <div className="flex items-center gap-3">
        <IconButton tooltip="Volver" onClick={handleBackClick}>
          <ArrowLeft className="h-4 w-4" />
        </IconButton>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Matrícula</h1>
            <StatusBadge status={matricula.estado} />
            <span className="text-xs text-muted-foreground ml-auto">
              {format(new Date(matricula.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {persona?.nombres} {persona?.apellidos} · {persona?.tipoDocumento}: {persona?.numeroDocumento}
          </p>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel principal */}
        <div className="lg:col-span-2 space-y-4">

          {/* Datos del Estudiante */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Datos del Estudiante
              </h3>
              <Button
                variant="link"
                size="sm"
                className="px-0 gap-1 h-auto text-xs"
                onClick={() => navigate(`/personas/${matricula.personaId}`, { state: { from: `/matriculas/${matricula.id}`, fromLabel: "Matrícula" } })}
              >
                <ExternalLink className="h-3 w-3" />
                Ver perfil completo
              </Button>
            </div>
            {persona ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <EditableField
                    label="Nombres"
                    value={getPersonaValue("nombres")}
                    onChange={(v) => handlePersonaFieldChange("nombres", v)}
                  />
                  <EditableField
                    label="Apellidos"
                    value={getPersonaValue("apellidos")}
                    onChange={(v) => handlePersonaFieldChange("apellidos", v)}
                  />
                  <EditableField
                    label="Tipo Documento"
                    value={getPersonaValue("tipoDocumento")}
                    displayValue={getDisplayLabel(getPersonaValue("tipoDocumento"), TIPOS_DOCUMENTO)}
                    onChange={(v) => handlePersonaFieldChange("tipoDocumento", v)}
                    type="select"
                    options={[...TIPOS_DOCUMENTO]}
                    badge
                  />
                  <EditableField
                    label="No. Documento"
                    value={getPersonaValue("numeroDocumento")}
                    onChange={() => {}}
                    editable={false}
                  />
                  <EditableField
                    label="Género"
                    value={getPersonaValue("genero")}
                    displayValue={getDisplayLabel(getPersonaValue("genero"), GENEROS)}
                    onChange={(v) => handlePersonaFieldChange("genero", v)}
                    type="select"
                    options={[...GENEROS]}
                  />
                  <EditableField
                    label="Fecha Nacimiento"
                    value={getPersonaValue("fechaNacimiento")}
                    onChange={(v) => handlePersonaFieldChange("fechaNacimiento", v)}
                    type="date"
                  />
                  <EditableField
                    label="RH"
                    value={getPersonaValue("rh")}
                    displayValue={getDisplayLabel(getPersonaValue("rh"), GRUPOS_SANGUINEOS)}
                    onChange={(v) => handlePersonaFieldChange("rh", v)}
                    type="select"
                    options={[...GRUPOS_SANGUINEOS]}
                    badge
                  />
                  <EditableField
                    label="Nivel Educativo"
                    value={getPersonaValue("nivelEducativo")}
                    displayValue={getDisplayLabel(getPersonaValue("nivelEducativo"), NIVELES_EDUCATIVOS)}
                    onChange={(v) => handlePersonaFieldChange("nivelEducativo", v)}
                    type="select"
                    options={[...NIVELES_EDUCATIVOS]}
                  />
                  <EditableField
                    label="País de Nacimiento"
                    value={getPersonaValue("paisNacimiento")}
                    displayValue={getDisplayLabel(getPersonaValue("paisNacimiento"), PAISES)}
                    onChange={(v) => handlePersonaFieldChange("paisNacimiento", v)}
                    type="select"
                    options={[...PAISES]}
                  />
                  <EditableField
                    label="Email"
                    value={getPersonaValue("email")}
                    onChange={(v) => handlePersonaFieldChange("email", v)}
                    placeholder="Sin email"
                  />
                  <EditableField
                    label="Teléfono"
                    value={getPersonaValue("telefono")}
                    onChange={(v) => handlePersonaFieldChange("telefono", v)}
                  />
                </div>
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Contacto de Emergencia</p>
                  <div className="grid grid-cols-3 gap-3">
                    <EditableField
                      label="Nombre"
                      value={getPersonaEmergencyValue("nombre")}
                      onChange={(v) => handlePersonaNestedFieldChange("contactoEmergencia", "nombre", v)}
                    />
                    <EditableField
                      label="Teléfono"
                      value={getPersonaEmergencyValue("telefono")}
                      onChange={(v) => handlePersonaNestedFieldChange("contactoEmergencia", "telefono", v)}
                    />
                    <EditableField
                      label="Parentesco"
                      value={getPersonaEmergencyValue("parentesco")}
                      onChange={(v) => handlePersonaNestedFieldChange("contactoEmergencia", "parentesco", v)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Cargando datos del estudiante...</p>
            )}
          </div>

          {/* Historial de Formación Previa */}
          {(matricula.nivelPrevio || matricula.centroFormacionPrevio) && (
            <div className="border rounded-lg p-4 shadow-sm space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Formación Previa
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <EditableField
                  label="Nivel Previo"
                  value={getValue("nivelPrevio")}
                  displayValue={getDisplayLabel(getValue("nivelPrevio"), NIVELES_PREVIOS)}
                  onChange={(v) => handleFieldChange("nivelPrevio", v)}
                  type="select"
                  options={[...NIVELES_PREVIOS]}
                  badge
                />
                <EditableField
                  label="Centro de Formación"
                  value={getValue("centroFormacionPrevio")}
                  onChange={(v) => handleFieldChange("centroFormacionPrevio", v)}
                />
              </div>
            </div>
          )}

          {/* Vinculación Laboral */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Vinculación Laboral
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 [&>*]:min-w-0">
              <EditableField
                label="Responsable del pago"
                value={getValue("tipoVinculacion")}
                displayValue={getDisplayLabel(getValue("tipoVinculacion"), TIPOS_VINCULACION)}
                onChange={(v) => handleTipoVinculacionChange(v)}
                type="select"
                options={[...TIPOS_VINCULACION]}
                badge
              />
              <EditableField
                label="Cargo"
                value={getValue("empresaCargo")}
                onChange={(v) => handleFieldChange("empresaCargo", v)}
              />
              <EditableField
                label="Nivel de Formación"
                value={getValue("nivelFormacionId")}
                displayValue={resolveNivel(getValue("nivelFormacionId"))}
                onChange={(v) => handleFieldChange("nivelFormacionId", v)}
                type="select"
                options={nivelesOptions}
              />
              <EditableField
                label="Área de Trabajo"
                value={getValue("areaTrabajo")}
                displayValue={getDisplayLabel(getValue("areaTrabajo"), AREAS_TRABAJO)}
                onChange={(v) => handleFieldChange("areaTrabajo", v)}
                type="select"
                options={[...AREAS_TRABAJO]}
                badge
              />
              {(getValue("tipoVinculacion") === "empresa" || getValue("tipoVinculacion") === "arl") && (
                <>
                  <EditableField
                    label="Empresa"
                    value={getValue("empresaId") || getValue("empresaNombre")}
                    displayValue={getValue("empresaNombre")}
                    onChange={(v) => handleEmpresaSelect(v)}
                    type="select"
                    options={empresasOptions}
                  />
                  <EditableField
                    label="NIT"
                    value={getValue("empresaNit")}
                    onChange={(v) => handleFieldChange("empresaNit", v)}
                    editable={false}
                  />
                  <EditableField
                    label="Representante Legal"
                    value={getValue("empresaRepresentanteLegal")}
                    onChange={(v) => handleFieldChange("empresaRepresentanteLegal", v)}
                    editable={false}
                  />
                  <EditableField
                    label="Contacto Empresa"
                    value={getValue("empresaContactoNombre")}
                    onChange={(v) => handleFieldChange("empresaContactoNombre", v)}
                  />
                  <EditableField
                    label="Tel. Contacto"
                    value={getValue("empresaContactoTelefono")}
                    onChange={(v) => handleFieldChange("empresaContactoTelefono", v)}
                  />
                </>
              )}
              {getValue("tipoVinculacion") === "independiente" && (
                <>
                  <EditableField
                    label="Empresa"
                    value={getValue("empresaNombre")}
                    onChange={() => {}}
                    editable={false}
                  />
                  <EditableField
                    label="NIT"
                    value={getValue("empresaNit")}
                    onChange={() => {}}
                    editable={false}
                  />
                </>
              )}
              <EditableField
                label="Sector Económico"
                value={getValue("sectorEconomico")}
                displayValue={getDisplayLabel(getValue("sectorEconomico"), SECTORES_ECONOMICOS)}
                onChange={(v) => handleFieldChange("sectorEconomico", v)}
                type="select"
                options={[...SECTORES_ECONOMICOS]}
              />
              {getValue("sectorEconomico") === "otro_sector" && (
                <EditableField
                  label="Sector (especifique)"
                  value={getValue("sectorEconomicoOtro")}
                  onChange={(v) => handleFieldChange("sectorEconomicoOtro", v)}
                  placeholder="Nombre del sector económico"
                />
              )}
              <EditableField
                label="EPS"
                value={getValue("eps")}
                displayValue={getDisplayLabel(getValue("eps"), EPS_OPTIONS)}
                onChange={(v) => handleFieldChange("eps", v)}
                type="select"
                options={[...EPS_OPTIONS]}
              />
              {getValue("eps") === "otra_eps" && (
                <EditableField
                  label="Nombre EPS"
                  value={getValue("epsOtra")}
                  onChange={(v) => handleFieldChange("epsOtra", v)}
                  placeholder="Escriba el nombre de la EPS..."
                />
              )}
              <EditableField
                label="ARL"
                value={getValue("arl")}
                displayValue={getDisplayLabel(getValue("arl"), ARL_OPTIONS)}
                onChange={(v) => handleFieldChange("arl", v)}
                type="select"
                options={[...ARL_OPTIONS]}
              />
              {getValue("arl") === "otra_arl" && (
                <EditableField
                  label="Nombre ARL"
                  value={getValue("arlOtra")}
                  onChange={(v) => handleFieldChange("arlOtra", v)}
                  placeholder="Escriba el nombre de la ARL..."
                />
              )}
            </div>
            {(getValue("empresaId") || matricula.empresaId) && (getValue("tipoVinculacion") === "empresa" || getValue("tipoVinculacion") === "arl") && (
              <Button
                variant="link"
                size="sm"
                className="px-0 gap-1 h-auto text-xs mt-2"
                onClick={() => navigate(`/empresas/${getValue("empresaId") || matricula.empresaId}`, { state: { from: `/matriculas/${matricula.id}`, fromLabel: "Matrícula" } })}
              >
                <ExternalLink className="h-3 w-3" />
                Ver empresa en directorio
              </Button>
            )}
          </div>

          {/* Documentos */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Requisitos documentales
            </h3>
            <DocumentosCarga
              documentos={matricula.documentos}
              onUpload={handleUploadDoc}
              onDelete={handleDeleteDoc}
              onFechaChange={handleDocFechaChange}
              isUploading={uploadDocumento.isPending}
            />
          </div>

          {/* Cobros / Cartera */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cobros / Cartera
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(getValue("tipoVinculacion") === 'empresa' || getValue("tipoVinculacion") === 'arl') && (
                <>
                  <EditableField
                    label="Contacto cobro"
                    value={getValue("cobroContactoNombre")}
                    onChange={(v) => handleFieldChange("cobroContactoNombre", v)}
                  />
                  <EditableField
                    label="Celular contacto"
                    value={getValue("cobroContactoCelular")}
                    onChange={(v) => handleFieldChange("cobroContactoCelular", v)}
                  />
                  <div />
                </>
              )}
              <EditableField
                label="Valor del cupo"
                type="currency"
                value={getValue("valorCupo")}
                onChange={(v) => handleFieldChange("valorCupo", Number(v) || 0)}
              />
              <EditableField
                label="Abono"
                type="currency"
                value={getValue("abono")}
                onChange={(v) => handleFieldChange("abono", Number(v) || 0)}
              />
              <div>
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className={cn("text-sm font-bold", (Number(getValue("valorCupo")) || 0) - (Number(getValue("abono")) || 0) > 0 ? 'text-destructive' : 'text-emerald-600')}>
                  ${((Number(getValue("valorCupo")) || 0) - (Number(getValue("abono")) || 0)).toLocaleString('es-CO')}
                </p>
              </div>
              <EditableField
                label="Fecha facturación"
                value={getValue("fechaFacturacion")}
                onChange={(v) => handleFieldChange("fechaFacturacion", v)}
                type="date"
              />
              <EditableField
                label="No. CTA-FACT"
                value={getValue("ctaFactNumero")}
                onChange={(v) => handleFieldChange("ctaFactNumero", v)}
              />
              <EditableField
                label="Titular"
                value={getValue("ctaFactTitular")}
                onChange={(v) => handleFieldChange("ctaFactTitular", v)}
              />
              <EditableField
                label="Fecha de pago"
                value={getValue("fechaPago")}
                onChange={(v) => handleFieldChange("fechaPago", v)}
                type="date"
              />
              <EditableField
                label="Forma de pago"
                value={getValue("formaPago")}
                displayValue={getValue("formaPago") ? getDisplayLabel(getValue("formaPago"), FORMAS_PAGO) : ""}
                onChange={(v) => handleFieldChange("formaPago", v)}
                type="select"
                options={[...FORMAS_PAGO]}
              />
              {getValue("formaPago") === "otro" && (
                <EditableField
                  label="Método de pago personalizado"
                  value={getValue("formaPago") === "otro" ? (formData["formaPagoOtro"] as string || "") : ""}
                  onChange={(v) => handleFieldChange("formaPagoOtro", v)}
                  placeholder="Escriba el método de pago..."
                />
              )}
              <div>
                <p className="text-xs text-muted-foreground">Estado</p>
                <StatusBadge status={matricula.pagado ? "pagado" : "sin_facturar"} />
              </div>
            </div>
            {!matricula.pagado && (
              <Button size="sm" className="mt-2" onClick={() => setPagoDialogOpen(true)}>
                <CreditCard className="h-4 w-4 mr-1" />
                Registrar Pago
              </Button>
            )}
            {hasGrupoCartera === false && (
              <Button size="sm" variant="outline" className="mt-2 ml-2" onClick={handleSyncCartera} disabled={syncingCartera}>
                <RefreshCw className={cn("h-4 w-4 mr-1", syncingCartera && "animate-spin")} />
                Sincronizar Cartera
              </Button>
            )}
            <div className="mt-4 pt-4 border-t">
              <ComentariosSection
                entidadId={matricula.id}
                seccion="cartera"
                titulo="Seguimiento de Cartera"
              />
            </div>
          </div>

          {/* Certificación */}
          <CertificacionSection
            matricula={matricula}
            persona={persona}
            curso={curso}
            formatosDinamicos={formatosDinamicos}
            onFieldChange={handleFieldChange}
            getValue={getValue}
          />

          {/* Observaciones - Sistema de comentarios */}
          <div className="border rounded-lg p-4 shadow-sm">
            <ComentariosSection
              entidadId={matricula.id}
              seccion="observaciones"
              titulo="Observaciones"
            />
          </div>
        </div>

        {/* Sidebar - Checklist compacto */}
        <div className="space-y-4">
          {/* Curso */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Curso
            </h3>
            {curso ? (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">{curso.nombre}</p>
                {codigoEstudiante && (
                  <div>
                    <p className="text-xs text-muted-foreground">Código estudiante</p>
                    <p className="font-mono text-sm">{codigoEstudiante}</p>
                  </div>
                )}
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
                  onClick={() => navigate(`/cursos/${curso.id}`)}
                >
                  <ExternalLink className="h-3 w-3" />
                  Ver curso
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin curso asignado</p>
            )}
          </div>

          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Formatos para Formación
            </h3>
             <FormatosList
              formatos={(formatosDinamicos ?? []).map((f) => ({
                id: f.id,
                nombre: f.nombre,
                codigo: f.codigo,
                estado: resolveFormatoEstado(f, respuestas),
              }))}
              onPreview={(id) => {
                const fmt = formatosDinamicos?.find((f) => f.id === id);
                if (fmt) { setDynamicFormato(fmt); }
              }}
              onDownload={(id) => {
                const fmt = formatosDinamicos?.find((f) => f.id === id);
                if (fmt) { setDynamicFormato(fmt); }
              }}
            />
          </div>

        </div>
      </div>

      {/* Barra flotante de guardar */}
      {(isDirty || isPersonaDirty) && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-background border rounded-lg shadow-lg p-3">
          <Button variant="outline" size="sm" onClick={() => { handleCancel(); handleCancelPersona(); }}>
            Cancelar
          </Button>
          <Button size="sm" onClick={async () => { if (isDirty) await handleSave(); if (isPersonaDirty) await handleSavePersona(); }} disabled={updateMatricula.isPending || updatePersona.isPending}>
            {(updateMatricula.isPending || updatePersona.isPending) ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      )}

      {/* Dialog de Pago */}
      <Dialog open={pagoDialogOpen} onOpenChange={setPagoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Número de Factura / Cuenta de Cobro</Label>
              <Input
                value={facturaNumero}
                onChange={(e) => setFacturaNumero(e.target.value)}
                placeholder="FAC-2024-001"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPagoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegistrarPago}>
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Preview de formatos */}
      <DynamicFormatoPreviewDialog
        open={!!dynamicFormato}
        onOpenChange={(open) => !open && setDynamicFormato(null)}
        formato={dynamicFormato}
        persona={persona ?? null}
        matricula={matricula}
        curso={curso ?? null}
      />

      <ConfirmDialog
        open={pendingNavPath !== null}
        onOpenChange={(open) => { if (!open) setPendingNavPath(null); }}
        title="Cambios sin guardar"
        description="Tienes cambios sin guardar en esta matrícula. ¿Qué deseas hacer?"
        confirmText="Descartar"
        cancelText="Seguir editando"
        onConfirm={handleNavDiscard}
        variant="destructive"
        secondaryText="Guardar"
        onSecondary={handleNavSave}
      />
    </div>
  );
}
