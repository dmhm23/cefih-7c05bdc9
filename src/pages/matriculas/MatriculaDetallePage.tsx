import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EditableField } from "@/components/shared/EditableField";
import { useMatricula, useUpdateMatricula, useUpdateDocumento, useRegistrarPago, useCambiarEstadoMatricula, useCapturarFirma, useUploadDocumento } from "@/hooks/useMatriculas";
import { usePersona } from "@/hooks/usePersonas";
import { useCurso } from "@/hooks/useCursos";
import { TIPO_FORMACION_LABELS, FORMA_PAGO_LABELS } from "@/types";
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
import { FirmaCaptura } from "@/components/matriculas/FirmaCaptura";
import { ConsentimientoSalud } from "@/components/matriculas/ConsentimientoSalud";
import { DocumentosCarga } from "@/components/matriculas/DocumentosCarga";
import {
  TIPOS_VINCULACION,
  AREAS_TRABAJO,
  SECTORES_ECONOMICOS,
  NIVELES_PREVIOS,
  FORMAS_PAGO,
} from "@/data/formOptions";

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  action?: () => void;
}

export default function MatriculaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false);
  const [facturaNumero, setFacturaNumero] = useState("");
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isDirty, setIsDirty] = useState(false);

  const { data: matricula, isLoading } = useMatricula(id || "");
  const { data: persona } = usePersona(matricula?.personaId || "");
  const { data: curso } = useCurso(matricula?.cursoId || "");

  const updateMatricula = useUpdateMatricula();
  const updateDocumento = useUpdateDocumento();
  const registrarPago = useRegistrarPago();
  const cambiarEstado = useCambiarEstadoMatricula();
  const capturarFirma = useCapturarFirma();
  const uploadDocumento = useUploadDocumento();

  useEffect(() => {
    setFormData({});
    setIsDirty(false);
  }, [matricula?.id]);

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
    { id: "consentimiento", label: "Consentimiento de salud", completed: matricula.consentimientoSalud },
    { id: "docs", label: `Documentos (${docsCompletos}/${totalDocs})`, completed: docsCompletos === totalDocs },
    { id: "firma", label: "Firma capturada", completed: matricula.firmaCapturada },
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

  const handleCapturarFirma = async (firmaBase64: string) => {
    try {
      await capturarFirma.mutateAsync({ id: matricula.id, firmaBase64 });
      toast({ title: "Firma capturada correctamente" });
    } catch {
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
    } catch {
      toast({ title: "Error al cargar documento", variant: "destructive" });
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
        <Button variant="ghost" size="icon" onClick={() => navigate("/matriculas")}>
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

      {/* Barra resumen: Estudiante + Curso */}
      <div className="flex gap-4 text-sm border rounded p-2.5">
        <div
          className="flex-1 cursor-pointer hover:text-primary transition-colors"
          onClick={() => navigate(`/personas/${matricula.personaId}`)}
        >
          <span className="text-xs text-muted-foreground">Estudiante:</span>{" "}
          <span className="font-medium">{persona?.nombres} {persona?.apellidos}</span>
        </div>
        <div className="border-l" />
        <div
          className="flex-1 cursor-pointer hover:text-primary transition-colors"
          onClick={() => matricula.cursoId && navigate(`/cursos/${matricula.cursoId}`)}
        >
          <span className="text-xs text-muted-foreground">Curso:</span>{" "}
          <span className="font-medium">{curso?.nombre || "Sin curso"}</span>
          <span className="text-xs text-muted-foreground ml-1">({TIPO_FORMACION_LABELS[matricula.tipoFormacion]})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel principal */}
        <div className="lg:col-span-2 space-y-4">
          {/* Consentimiento de Salud */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Consentimiento de Salud
              </h3>
              <Badge variant="outline" className={cn("text-xs ml-auto", matricula.consentimientoSalud ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600")}>
                {matricula.consentimientoSalud ? "Completado" : "Pendiente"}
              </Badge>
            </div>
            <ConsentimientoSalud
              data={{
                consentimientoSalud: matricula.consentimientoSalud,
                restriccionMedica: matricula.restriccionMedica,
                restriccionMedicaDetalle: matricula.restriccionMedicaDetalle,
                alergias: matricula.alergias,
                alergiasDetalle: matricula.alergiasDetalle,
                consumoMedicamentos: matricula.consumoMedicamentos,
                consumoMedicamentosDetalle: matricula.consumoMedicamentosDetalle,
                embarazo: matricula.embarazo,
                nivelLectoescritura: matricula.nivelLectoescritura,
              }}
              onChange={() => {}}
              showEmbarazo={persona?.genero === 'F'}
              readOnly
            />
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
                label="Tipo"
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
                label="Área de Trabajo"
                value={getValue("areaTrabajo")}
                displayValue={getDisplayLabel(getValue("areaTrabajo"), AREAS_TRABAJO)}
                onChange={(v) => handleFieldChange("areaTrabajo", v)}
                type="select"
                options={[...AREAS_TRABAJO]}
                badge
              />
              {(getValue("tipoVinculacion") === "empresa" || getValue("tipoVinculacion") === "independiente") && (
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
              <EditableField
                label="Sector Económico"
                value={getValue("sectorEconomico")}
                displayValue={getDisplayLabel(getValue("sectorEconomico"), SECTORES_ECONOMICOS)}
                onChange={(v) => handleFieldChange("sectorEconomico", v)}
                type="select"
                options={[...SECTORES_ECONOMICOS]}
              />
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
              onFechaChange={handleDocFechaChange}
              isUploading={uploadDocumento.isPending}
            />
          </div>

          {/* Firma Digital */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Firma Digital
              </h3>
              {matricula.firmaCapturada && (
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 ml-auto">Capturada</Badge>
              )}
            </div>
            <FirmaCaptura
              firmaExistente={matricula.firmaCapturada ? matricula.firmaBase64 : undefined}
              onGuardar={handleCapturarFirma}
              isPending={capturarFirma.isPending}
            />
          </div>

          {/* Autorización de Datos */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Autorización de Datos
            </h3>
            <div className="flex items-center gap-2 text-sm">
              {matricula.autorizacionDatos ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium">Autorización concedida</span>
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Pendiente de autorización</span>
                </>
              )}
            </div>
          </div>

          {/* Cobros / Cartera */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cobros / Cartera
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(getValue("tipoVinculacion") === 'empresa') && (
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
                <Badge variant={matricula.pagado ? "default" : "secondary"} className={matricula.pagado ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}>
                  {matricula.pagado ? "Pagado" : "Pendiente"}
                </Badge>
              </div>
            </div>
            {!matricula.pagado && (
              <Button size="sm" className="mt-2" onClick={() => setPagoDialogOpen(true)}>
                <CreditCard className="h-4 w-4 mr-1" />
                Registrar Pago
              </Button>
            )}
          </div>

          {/* Certificado */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Certificado
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <EditableField
                label="Fecha de generación"
                value={getValue("fechaGeneracionCertificado")}
                onChange={(v) => handleFieldChange("fechaGeneracionCertificado", v)}
                type="date"
              />
              <EditableField
                label="Fecha de entrega"
                value={getValue("fechaEntregaCertificado")}
                onChange={(v) => handleFieldChange("fechaEntregaCertificado", v)}
                type="date"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Observaciones
            </h3>
            <EditableField
              label=""
              value={getValue("observaciones")}
              onChange={(v) => handleFieldChange("observaciones", v)}
              placeholder="Sin observaciones"
            />
          </div>
        </div>

        {/* Sidebar - Checklist compacto */}
        <div className="space-y-4">
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Progreso
            </h3>
            <div className="flex justify-between text-xs mb-1">
              <span>{completedItems} de {checklistItems.length}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />

            <div className="space-y-1 mt-2">
              {checklistItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded text-sm transition-colors",
                    item.completed ? "text-emerald-700" : "text-muted-foreground",
                    item.action && !item.completed && "cursor-pointer hover:bg-muted"
                  )}
                  onClick={item.action}
                >
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      item.completed ? "bg-emerald-500" : "bg-muted-foreground/40"
                    )}
                  />
                  <span className={item.completed ? "font-medium" : ""}>{item.label}</span>
                </div>
              ))}
            </div>
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
      {isDirty && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-background border rounded-lg shadow-lg p-3">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateMatricula.isPending}>
            {updateMatricula.isPending ? "Guardando..." : "Guardar Cambios"}
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
    </div>
  );
}
