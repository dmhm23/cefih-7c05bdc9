import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, BookOpen, FileCheck, CreditCard, ClipboardCheck, MessageSquare, PenTool, HeartPulse, ShieldCheck, CheckCircle2, Circle, Wallet, Award, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useMatricula, useUpdateDocumento, useRegistrarPago, useCambiarEstadoMatricula, useCapturarFirma, useUploadDocumento } from "@/hooks/useMatriculas";
import { usePersona } from "@/hooks/usePersonas";
import { useCurso } from "@/hooks/useCursos";
import { TIPO_FORMACION_LABELS, FORMA_PAGO_LABELS } from "@/types";
import { FormaPago } from "@/types/matricula";
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
  icon: React.ElementType;
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
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2" />
          <Skeleton className="h-64" />
        </div>
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

  // Calcular progreso
  const docsCompletos = matricula.documentos.filter((d) => d.estado !== "pendiente").length;
  const totalDocs = matricula.documentos.length;
  const checklistItems: ChecklistItem[] = [
    {
      id: "consentimiento",
      label: "Consentimiento de salud",
      completed: matricula.consentimientoSalud,
      icon: HeartPulse,
    },
    {
      id: "docs",
      label: `Documentos (${docsCompletos}/${totalDocs})`,
      completed: docsCompletos === totalDocs,
      icon: FileCheck,
    },
    {
      id: "firma",
      label: "Firma capturada",
      completed: matricula.firmaCapturada,
      icon: PenTool,
    },
    {
      id: "pago",
      label: "Pago registrado",
      completed: matricula.pagado,
      icon: CreditCard,
      action: () => !matricula.pagado && setPagoDialogOpen(true),
    },
    {
      id: "evaluacion",
      label: "Evaluación completada",
      completed: matricula.evaluacionCompletada,
      icon: ClipboardCheck,
    },
    {
      id: "encuesta",
      label: "Encuesta de satisfacción",
      completed: matricula.encuestaCompletada,
      icon: MessageSquare,
    },
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/matriculas")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Dashboard de Matrícula</h1>
            <StatusBadge status={matricula.estado} />
          </div>
          <p className="text-muted-foreground">
            {persona?.nombres} {persona?.apellidos} - {persona?.tipoDocumento}: {persona?.numeroDocumento}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/personas/${matricula.personaId}`)}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estudiante</p>
                    <p className="font-semibold">{persona?.nombres} {persona?.apellidos}</p>
                    <p className="text-sm text-muted-foreground">{persona?.tipoDocumento}: {persona?.numeroDocumento}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => matricula.cursoId && navigate(`/cursos/${matricula.cursoId}`)}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Curso</p>
                    <p className="font-semibold truncate max-w-[200px]">{curso?.nombre || "Sin curso asignado"}</p>
                    <p className="text-sm text-muted-foreground">{TIPO_FORMACION_LABELS[matricula.tipoFormacion]}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Consentimiento de Salud */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5" />
                Consentimiento de Salud
                {matricula.consentimientoSalud ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 ml-auto">Completado</Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 ml-auto">Pendiente</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Historial de Formación Previa */}
          {(matricula.nivelPrevio || matricula.centroFormacionPrevio) && (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Formación Previa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {matricula.nivelPrevio && (
                    <div>
                      <p className="text-sm text-muted-foreground">Nivel Previo</p>
                      <p className="font-medium">{matricula.nivelPrevio === 'trabajador_autorizado' ? 'Trabajador Autorizado' : 'Avanzado Trabajo en Alturas'}</p>
                    </div>
                  )}
                  {matricula.centroFormacionPrevio && (
                    <div>
                      <p className="text-sm text-muted-foreground">Centro de Formación</p>
                      <p className="font-medium">{matricula.centroFormacionPrevio}</p>
                    </div>
                  )}
                  {matricula.fechaCertificacionPrevia && (
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha Certificación</p>
                      <p className="font-medium">{matricula.fechaCertificacionPrevia}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vinculación Laboral */}
          {matricula.tipoVinculacion && (
            <Card>
              <CardHeader>
                <CardTitle>Vinculación Laboral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium">{matricula.tipoVinculacion === 'empresa' ? 'Empresa' : 'Independiente'}</p>
                  </div>
                  {matricula.empresaCargo && (
                    <div>
                      <p className="text-sm text-muted-foreground">Cargo</p>
                      <p className="font-medium">{matricula.empresaCargo}</p>
                    </div>
                  )}
                  {matricula.areaTrabajo && (
                    <div>
                      <p className="text-sm text-muted-foreground">Área de Trabajo</p>
                      <p className="font-medium">{matricula.areaTrabajo === 'administrativo' ? 'Administrativo' : 'Operativa'}</p>
                    </div>
                  )}
                  {matricula.tipoVinculacion === 'empresa' && matricula.empresaNombre && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Empresa</p>
                        <p className="font-medium">{matricula.empresaNombre}</p>
                      </div>
                      {matricula.empresaNit && (
                        <div>
                          <p className="text-sm text-muted-foreground">NIT</p>
                          <p className="font-medium">{matricula.empresaNit}</p>
                        </div>
                      )}
                      {matricula.empresaRepresentanteLegal && (
                        <div>
                          <p className="text-sm text-muted-foreground">Representante Legal</p>
                          <p className="font-medium">{matricula.empresaRepresentanteLegal}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documentos */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos Requeridos</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentosCarga
                documentos={matricula.documentos}
                onUpload={handleUploadDoc}
                onFechaChange={handleDocFechaChange}
                isUploading={uploadDocumento.isPending}
              />
            </CardContent>
          </Card>

          {/* Firma Digital */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Firma Digital
                {matricula.firmaCapturada && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 ml-auto">Capturada</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FirmaCaptura
                firmaExistente={matricula.firmaCapturada ? matricula.firmaBase64 : undefined}
                onGuardar={handleCapturarFirma}
                isPending={capturarFirma.isPending}
              />
            </CardContent>
          </Card>

          {/* Autorización de Datos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Autorización de Tratamiento de Datos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {matricula.autorizacionDatos ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium">Autorización concedida</span>
                  </>
                ) : (
                  <>
                    <Circle className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">Pendiente de autorización</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cobros / Cartera */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Cobros / Cartera
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {matricula.tipoVinculacion === 'empresa' && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Contacto cobro</p>
                      <p className="font-medium">{matricula.cobroContactoNombre || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Celular contacto</p>
                      <p className="font-medium">{matricula.cobroContactoCelular || '—'}</p>
                    </div>
                    <div />
                  </>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Valor del cupo</p>
                  <p className="font-medium text-lg">{matricula.valorCupo ? `$${matricula.valorCupo.toLocaleString('es-CO')}` : '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Abono</p>
                  <p className="font-medium text-lg">{matricula.abono ? `$${matricula.abono.toLocaleString('es-CO')}` : '$0'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className={cn("font-bold text-lg", (matricula.valorCupo ?? 0) - (matricula.abono ?? 0) > 0 ? 'text-destructive' : 'text-emerald-600')}>
                    ${((matricula.valorCupo ?? 0) - (matricula.abono ?? 0)).toLocaleString('es-CO')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha facturación</p>
                  <p className="font-medium">{matricula.fechaFacturacion || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">No. CTA-FACT</p>
                  <p className="font-medium">{matricula.ctaFactNumero || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Titular</p>
                  <p className="font-medium">{matricula.ctaFactTitular || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de pago</p>
                  <p className="font-medium">{matricula.fechaPago || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Forma de pago</p>
                  <p className="font-medium">{matricula.formaPago ? FORMA_PAGO_LABELS[matricula.formaPago] : '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant={matricula.pagado ? "default" : "secondary"} className={matricula.pagado ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}>
                    {matricula.pagado ? "Pagado" : "Pendiente"}
                  </Badge>
                </div>
              </div>
              {!matricula.pagado && (
                <Button className="mt-4" onClick={() => setPagoDialogOpen(true)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Registrar Pago
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Certificado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certificado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de generación</p>
                  <p className="font-medium">{matricula.fechaGeneracionCertificado || 'No generado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de entrega</p>
                  <p className="font-medium">{matricula.fechaEntregaCertificado || 'No entregado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observaciones */}
          {matricula.observaciones && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareText className="h-5 w-5" />
                  Observaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{matricula.observaciones}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Checklist */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Progreso de Matrícula</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>{completedItems} de {checklistItems.length} completados</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              <div className="space-y-2">
                {checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                      item.completed
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-muted/50 border-border",
                      item.action && !item.completed && "cursor-pointer hover:bg-muted"
                    )}
                    onClick={item.action}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center",
                        item.completed
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-200 text-gray-400"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        item.completed ? "text-emerald-700" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {matricula.estado === "pendiente" && progressPercent === 100 && (
                <Button
                  className="w-full"
                  onClick={() => handleCambiarEstado("completa")}
                >
                  Marcar como Completa
                </Button>
              )}
              {matricula.estado === "completa" && (
                <Button
                  className="w-full"
                  onClick={() => handleCambiarEstado("certificada")}
                >
                  Generar Certificado
                </Button>
              )}
              <Button variant="outline" className="w-full">
                Ver Historial
              </Button>
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creada:</span>
                  <span>{format(new Date(matricula.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actualizada:</span>
                  <span>{format(new Date(matricula.updatedAt), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
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
