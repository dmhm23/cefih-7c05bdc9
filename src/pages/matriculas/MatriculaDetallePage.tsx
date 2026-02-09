import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useMatricula, useUpdateDocumento, useRegistrarPago, useCambiarEstadoMatricula, useCapturarFirma, useUploadDocumento } from "@/hooks/useMatriculas";
import { usePersona } from "@/hooks/usePersonas";
import { useCurso } from "@/hooks/useCursos";
import { TIPO_FORMACION_LABELS, FORMA_PAGO_LABELS } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState } from "react";
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

  const { data: matricula, isLoading } = useMatricula(id || "");
  const { data: persona } = usePersona(matricula?.personaId || "");
  const { data: curso } = useCurso(matricula?.cursoId || "");
  
  const updateDocumento = useUpdateDocumento();
  const registrarPago = useRegistrarPago();
  const cambiarEstado = useCambiarEstadoMatricula();
  const capturarFirma = useCapturarFirma();
  const uploadDocumento = useUploadDocumento();

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
          <div className="border rounded-lg p-4 space-y-2">
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
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Formación Previa
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {matricula.nivelPrevio && (
                  <div>
                    <p className="text-xs text-muted-foreground">Nivel Previo</p>
                    <p className="text-sm font-medium">{matricula.nivelPrevio === 'trabajador_autorizado' ? 'Trabajador Autorizado' : 'Avanzado Trabajo en Alturas'}</p>
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
                    <p className="text-xs text-muted-foreground">Fecha Certificación</p>
                    <p className="text-sm font-medium">{matricula.fechaCertificacionPrevia}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vinculación Laboral */}
          {matricula.tipoVinculacion && (
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Vinculación Laboral
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="text-sm font-medium">{matricula.tipoVinculacion === 'empresa' ? 'Empresa' : 'Independiente'}</p>
                </div>
                {matricula.empresaCargo && (
                  <div>
                    <p className="text-xs text-muted-foreground">Cargo</p>
                    <p className="text-sm font-medium">{matricula.empresaCargo}</p>
                  </div>
                )}
                {matricula.areaTrabajo && (
                  <div>
                    <p className="text-xs text-muted-foreground">Área de Trabajo</p>
                    <p className="text-sm font-medium">{matricula.areaTrabajo === 'administrativo' ? 'Administrativo' : 'Operativa'}</p>
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
                    {matricula.empresaRepresentanteLegal && (
                      <div>
                        <p className="text-xs text-muted-foreground">Representante Legal</p>
                        <p className="text-sm font-medium">{matricula.empresaRepresentanteLegal}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Documentos */}
          <div className="border rounded-lg p-4 space-y-2">
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
          <div className="border rounded-lg p-4 space-y-2">
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
          <div className="border rounded-lg p-4 space-y-2">
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
          <div className="border rounded-lg p-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cobros / Cartera
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {matricula.tipoVinculacion === 'empresa' && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Contacto cobro</p>
                    <p className="text-sm font-medium">{matricula.cobroContactoNombre || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Celular contacto</p>
                    <p className="text-sm font-medium">{matricula.cobroContactoCelular || '—'}</p>
                  </div>
                  <div />
                </>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Valor del cupo</p>
                <p className="text-sm font-semibold">{matricula.valorCupo ? `$${matricula.valorCupo.toLocaleString('es-CO')}` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Abono</p>
                <p className="text-sm font-semibold">{matricula.abono ? `$${matricula.abono.toLocaleString('es-CO')}` : '$0'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className={cn("text-sm font-bold", (matricula.valorCupo ?? 0) - (matricula.abono ?? 0) > 0 ? 'text-destructive' : 'text-emerald-600')}>
                  ${((matricula.valorCupo ?? 0) - (matricula.abono ?? 0)).toLocaleString('es-CO')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha facturación</p>
                <p className="text-sm font-medium">{matricula.fechaFacturacion || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">No. CTA-FACT</p>
                <p className="text-sm font-medium">{matricula.ctaFactNumero || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Titular</p>
                <p className="text-sm font-medium">{matricula.ctaFactTitular || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha de pago</p>
                <p className="text-sm font-medium">{matricula.fechaPago || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Forma de pago</p>
                <p className="text-sm font-medium">{matricula.formaPago ? FORMA_PAGO_LABELS[matricula.formaPago] : '—'}</p>
              </div>
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
          <div className="border rounded-lg p-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Certificado
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Fecha de generación</p>
                <p className="text-sm font-medium">{matricula.fechaGeneracionCertificado || 'No generado'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha de entrega</p>
                <p className="text-sm font-medium">{matricula.fechaEntregaCertificado || 'No entregado'}</p>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          {matricula.observaciones && (
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Observaciones
              </h3>
              <p className="text-sm whitespace-pre-wrap">{matricula.observaciones}</p>
            </div>
          )}
        </div>

        {/* Sidebar - Checklist compacto */}
        <div className="space-y-4">
          <div className="border rounded-lg p-4 space-y-2">
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
          <div className="border rounded-lg p-4 space-y-2">
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
