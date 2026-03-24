import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CreditCard, ExternalLink } from "lucide-react";
import { CertificacionSection } from "@/components/matriculas/CertificacionSection";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EditableField } from "@/components/shared/EditableField";
import { useMatricula, useUpdateMatricula, useUpdateDocumento, useRegistrarPago, useCambiarEstadoMatricula, useUploadDocumento } from "@/hooks/useMatriculas";
import { usePersona, useUpdatePersona } from "@/hooks/usePersonas";
import { PersonaFormData } from "@/types/persona";
import { useCurso } from "@/hooks/useCursos";
import { useFormatosMatricula } from "@/hooks/useFormatosFormacion";
import { resolveFormatoEstado } from "@/utils/resolveFormatoEstado";
import { FORMA_PAGO_LABELS } from "@/types";
import { Matricula } from "@/types/matricula";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import InfoAprendizPreviewDialog from "@/components/matriculas/formatos/InfoAprendizPreviewDialog";
import RegistroAsistenciaPreviewDialog from "@/components/matriculas/formatos/RegistroAsistenciaPreviewDialog";
import ParticipacionPtaAtsPreviewDialog from "@/components/matriculas/formatos/ParticipacionPtaAtsPreviewDialog";
import EvaluacionReentrenamientoPreviewDialog from "@/components/matriculas/formatos/EvaluacionReentrenamientoPreviewDialog";
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
import { resolveNivelFormacionLabel } from "@/utils/resolveNivelLabel";
import { useNivelesFormacion } from "@/hooks/useNivelesFormacion";

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  action?: () => void;
}

type PreviewFormatoId = string | null;

const LEGACY_IDS = new Set(["info_aprendiz", "registro_asistencia", "participacion_pta_ats", "evaluacion_reentrenamiento"]);

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

  const { data: matricula, isLoading } = useMatricula(id || "");
  const { data: persona } = usePersona(matricula?.personaId || "");
  const { data: curso } = useCurso(matricula?.cursoId || "");
  const { data: formatosDinamicos } = useFormatosMatricula(curso?.tipoFormacion);
  const updateMatricula = useUpdateMatricula();
  const updateDocumento = useUpdateDocumento();
  const registrarPago = useRegistrarPago();
  const cambiarEstado = useCambiarEstadoMatricula();
  const uploadDocumento = useUploadDocumento();
  const updatePersona = useUpdatePersona();
  const { data: nivelesFormacion = [] } = useNivelesFormacion();
  const nivelesOptions = nivelesFormacion.map((n) => ({ value: n.id, label: n.nombreNivel }));

  useEffect(() => {
    setFormData({});
    setIsDirty(false);
    setPersonaFormData({});
    setIsPersonaDirty(false);
  }, [matricula?.id]);

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

  const handleSave = async () => {
    try {
      await updateMatricula.mutateAsync({ id: matricula.id, data: formData });
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
        <Button variant="ghost" size="icon" onClick={() => navigate(fromPath)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
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
                <EditableField
                  label="Fecha Certificación"
                  value={getValue("fechaCertificacionPrevia")}
                  onChange={(v) => handleFieldChange("fechaCertificacionPrevia", v)}
                  type="date"
                />
              </div>
            </div>
          )}

          {/* Vinculación Laboral */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Vinculación Laboral
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <EditableField
                label="Responsable del pago"
                value={getValue("tipoVinculacion")}
                displayValue={getDisplayLabel(getValue("tipoVinculacion"), TIPOS_VINCULACION)}
                onChange={(v) => handleFieldChange("tipoVinculacion", v)}
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
                value={getValue("empresaNivelFormacion")}
                displayValue={resolveNivelFormacionLabel(getValue("empresaNivelFormacion"))}
                onChange={(v) => handleFieldChange("empresaNivelFormacion", v)}
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
              {(getValue("tipoVinculacion") === "empresa" || getValue("tipoVinculacion") === "independiente" || getValue("tipoVinculacion") === "arl") && (
                <>
                  <EditableField
                    label="Empresa"
                    value={getValue("empresaNombre")}
                    onChange={(v) => handleFieldChange("empresaNombre", v)}
                  />
                  <EditableField
                    label="NIT"
                    value={getValue("empresaNit")}
                    onChange={(v) => handleFieldChange("empresaNit", v)}
                  />
                  <EditableField
                    label="Representante Legal"
                    value={getValue("empresaRepresentanteLegal")}
                    onChange={(v) => handleFieldChange("empresaRepresentanteLegal", v)}
                  />
                </>
              )}
              {(getValue("tipoVinculacion") === "empresa" || getValue("tipoVinculacion") === "arl") && (
                <>
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
              <EditableField
                label="Sector Económico"
                value={getValue("sectorEconomico")}
                displayValue={getDisplayLabel(getValue("sectorEconomico"), SECTORES_ECONOMICOS)}
                onChange={(v) => handleFieldChange("sectorEconomico", v)}
                type="select"
                options={[...SECTORES_ECONOMICOS]}
              />
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
          </div>

          {/* Documentos */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Documentos Requeridos
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
                value={getValue("valorCupo")}
                onChange={(v) => handleFieldChange("valorCupo", Number(v) || 0)}
              />
              <EditableField
                label="Abono"
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
            <div className="mt-4 pt-4 border-t">
              <ComentariosSection
                matriculaId={matricula.id}
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
              matriculaId={matricula.id}
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
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha inicio</p>
                    <p>{format(new Date(curso.fechaInicio), "d MMM yyyy", { locale: es })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha fin</p>
                    <p>{format(new Date(curso.fechaFin), "d MMM yyyy", { locale: es })}</p>
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
                id: f.legacyComponentId || f.id,
                nombre: f.nombre,
                codigo: f.codigo,
                estado: resolveFormatoEstado(f, matricula),
              }))}
              onPreview={(id) => {
                if (LEGACY_IDS.has(id)) {
                  setPreviewFormato(id);
                } else {
                  const fmt = formatosDinamicos?.find((f) => f.id === id);
                  if (fmt) { setDynamicFormato(fmt); }
                }
              }}
              onDownload={(id) => {
                if (LEGACY_IDS.has(id)) {
                  setPreviewFormato(id);
                } else {
                  const fmt = formatosDinamicos?.find((f) => f.id === id);
                  if (fmt) { setDynamicFormato(fmt); }
                }
              }}
            />
          </div>

          {/* Acciones */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Acciones
            </h3>
            {matricula.estado === "pendiente" && progressPercent === 100 && (
              <Button size="sm" className="w-full" onClick={() => handleCambiarEstado("completa")}>
                Marcar como Completa
              </Button>
            )}
            {matricula.estado === "completa" && (
              <Button size="sm" className="w-full" onClick={() => handleCambiarEstado("certificada")}>
                Generar Certificado
              </Button>
            )}
            <Button variant="outline" size="sm" className="w-full">
              Ver Historial
            </Button>
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
      <InfoAprendizPreviewDialog
        open={previewFormato === "info_aprendiz"}
        onOpenChange={(open) => !open && setPreviewFormato(null)}
        persona={persona ?? null}
        matricula={matricula}
        curso={curso ?? null}
      />
      <RegistroAsistenciaPreviewDialog
        open={previewFormato === "registro_asistencia"}
        onOpenChange={(open) => !open && setPreviewFormato(null)}
        persona={persona ?? null}
        matricula={matricula}
        curso={curso ?? null}
      />
      <ParticipacionPtaAtsPreviewDialog
        open={previewFormato === "participacion_pta_ats"}
        onOpenChange={(open) => !open && setPreviewFormato(null)}
        persona={persona ?? null}
        matricula={matricula}
        curso={curso ?? null}
      />
      <EvaluacionReentrenamientoPreviewDialog
        open={previewFormato === "evaluacion_reentrenamiento"}
        onOpenChange={(open) => !open && setPreviewFormato(null)}
        persona={persona ?? null}
        matricula={matricula}
        curso={curso ?? null}
      />
      <DynamicFormatoPreviewDialog
        open={!!dynamicFormato}
        onOpenChange={(open) => !open && setDynamicFormato(null)}
        formato={dynamicFormato}
        persona={persona ?? null}
        matricula={matricula}
        curso={curso ?? null}
      />
    </div>
  );
}
