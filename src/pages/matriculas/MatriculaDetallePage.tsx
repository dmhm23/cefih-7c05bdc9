import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, BookOpen, FileCheck, CreditCard, ClipboardCheck, MessageSquare, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useMatricula, useUpdateDocumento, useRegistrarPago, useCambiarEstadoMatricula } from "@/hooks/useMatriculas";
import { usePersona } from "@/hooks/usePersonas";
import { useCurso } from "@/hooks/useCursos";
import { TIPO_FORMACION_LABELS } from "@/types";
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

  const handleSimularDocumento = async (docId: string) => {
    try {
      await updateDocumento.mutateAsync({
        matriculaId: matricula.id,
        documentoId: docId,
        data: {
          estado: "cargado",
          fechaCarga: new Date().toISOString().split("T")[0],
          urlDrive: `https://drive.google.com/mock/${docId}`,
        },
      });
      toast({ title: "Documento cargado (simulado)" });
    } catch {
      toast({ title: "Error al cargar documento", variant: "destructive" });
    }
  };

  const handleRegistrarPago = async () => {
    if (!facturaNumero.trim()) {
      toast({ title: "Ingrese el número de factura", variant: "destructive" });
      return;
    }
    try {
      await registrarPago.mutateAsync({ id: matricula.id, facturaNumero });
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
                      {matricula.empresaCargo && (
                        <div>
                          <p className="text-sm text-muted-foreground">Cargo</p>
                          <p className="font-medium">{matricula.empresaCargo}</p>
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
              <div className="space-y-3">
                {matricula.documentos.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          doc.estado === "verificado"
                            ? "bg-emerald-100 text-emerald-600"
                            : doc.estado === "cargado"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-400"
                        )}
                      >
                        <FileCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.nombre}</p>
                        {doc.fechaCarga && (
                          <p className="text-xs text-muted-foreground">
                            Cargado: {doc.fechaCarga}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        status={
                          doc.estado === "verificado"
                            ? "verde"
                            : doc.estado === "cargado"
                            ? "amarillo"
                            : "rojo"
                        }
                      />
                      {doc.estado === "pendiente" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSimularDocumento(doc.id)}
                        >
                          Simular Carga
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Información de Pago */}
          {matricula.pagado && (
            <Card>
              <CardHeader>
                <CardTitle>Información de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Número de Factura</p>
                    <p className="font-medium">{matricula.facturaNumero}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Pago</p>
                    <p className="font-medium">{matricula.fechaPago}</p>
                  </div>
                </div>
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
