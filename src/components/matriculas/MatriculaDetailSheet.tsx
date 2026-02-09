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
} from "lucide-react";
import { DetailSheet, DetailSection } from "@/components/shared/DetailSheet";
import { EditableField } from "@/components/shared/EditableField";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useUpdateMatricula, useCambiarEstadoMatricula, useRegistrarPago } from "@/hooks/useMatriculas";
import { usePersonas } from "@/hooks/usePersonas";
import { useCursos } from "@/hooks/useCursos";
import {
  Matricula, ESTADO_MATRICULA_LABELS, TIPO_FORMACION_LABELS, EstadoMatricula, TipoFormacion,
  NIVEL_PREVIO_LABELS, TIPO_VINCULACION_LABELS, NIVEL_FORMACION_EMPRESA_LABELS,
} from "@/types/matricula";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AREAS_TRABAJO,
  SECTORES_ECONOMICOS,
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
  const { data: personas = [] } = usePersonas();
  const { data: cursos = [] } = useCursos();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFormData({});
    setIsDirty(false);
  }, [matricula?.id]);

  if (!matricula) return null;

  const persona = personas.find((p) => p.id === matricula.personaId);
  const curso = cursos.find((c) => c.id === matricula.cursoId);

  const handleFieldChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
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
      setIsDirty(false);
    } catch (error) {
      toast({ title: "Error al guardar", description: "No se pudieron guardar los cambios", variant: "destructive" });
    }
  };

  const handleCancel = () => { setFormData({}); setIsDirty(false); };

  const handleRegistrarPago = async () => {
    try {
      await registrarPago.mutateAsync({ id: matricula.id, facturaNumero: `FAC-${Date.now()}` });
      toast({ title: "Pago registrado correctamente" });
    } catch (error) {
      toast({ title: "Error al registrar pago", variant: "destructive" });
    }
  };

  const getValue = <K extends keyof Matricula>(field: K): Matricula[K] => {
    return (formData[field] as Matricula[K]) ?? matricula[field];
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
  ].filter(Boolean).length;
  const progressPercent = (completedSteps / 5) * 100;

  const personaName = persona ? `${persona.nombres} ${persona.apellidos}` : "N/A";
  const personaDoc = persona?.numeroDocumento || "";
  const cursoName = curso?.nombre || "Sin curso asignado";

  const handleFullScreen = () => {
    if (matricula) { onOpenChange(false); navigate(`/matriculas/${matricula.id}`); }
  };

  return (
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
        isDirty ? (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
            <Button onClick={handleSave} disabled={updateMatricula.isPending || cambiarEstado.isPending}>
              {updateMatricula.isPending || cambiarEstado.isPending ? "Guardando..." : "Guardar Cambios"}
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
            <span className="font-medium">{completedSteps}/5 completados</span>
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
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{personaName}</p>
              <p className="text-sm text-muted-foreground">{personaDoc}</p>
            </div>
          </div>
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

        {/* Checklist */}
        <DetailSection title="Checklist de Requisitos">
          <div className="space-y-3">
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

        {/* Pago */}
        <DetailSection title="Estado de Pago">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Estado de pago</span>
              </div>
              <Badge variant={matricula.pagado ? "default" : "secondary"} className={matricula.pagado ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}>
                {matricula.pagado ? "Pagado" : "Pendiente"}
              </Badge>
            </div>
            {matricula.pagado && matricula.facturaNumero && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Receipt className="h-4 w-4" />
                <span>Factura: {matricula.facturaNumero}</span>
              </div>
            )}
            {matricula.pagado && matricula.fechaPago && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Fecha: {format(new Date(matricula.fechaPago), "d MMM yyyy", { locale: es })}</span>
              </div>
            )}
            {!matricula.pagado && (
              <Button variant="outline" size="sm" className="w-full" onClick={handleRegistrarPago} disabled={registrarPago.isPending}>
                <CreditCard className="h-4 w-4 mr-2" />
                {registrarPago.isPending ? "Registrando..." : "Registrar Pago"}
              </Button>
            )}
          </div>
        </DetailSection>

        {/* Metadata */}
        <div className="text-xs text-muted-foreground pt-4">
          <p>Creada: {format(new Date(matricula.createdAt), "d MMM yyyy, HH:mm", { locale: es })}</p>
          <p>Actualizada: {format(new Date(matricula.updatedAt), "d MMM yyyy, HH:mm", { locale: es })}</p>
        </div>
      </div>
    </DetailSheet>
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
