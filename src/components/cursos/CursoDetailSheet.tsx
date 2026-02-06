import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  User,
  FileCheck,
} from "lucide-react";
import { DetailSheet, DetailSection } from "@/components/shared/DetailSheet";
import { EditableField } from "@/components/shared/EditableField";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useUpdateCurso, useCambiarEstadoCurso } from "@/hooks/useCursos";
import { useMatriculasByCurso } from "@/hooks/useMatriculas";
import { usePersonas } from "@/hooks/usePersonas";
import { Curso, CursoFormData, ESTADO_CURSO_LABELS, EstadoCurso } from "@/types/curso";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CursoDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  curso: Curso | null;
  currentIndex: number;
  totalCount: number;
  onNavigate: (direction: "prev" | "next") => void;
}

const ESTADO_OPTIONS = [
  { value: "abierto", label: "Abierto" },
  { value: "en_progreso", label: "En Progreso" },
  { value: "cerrado", label: "Cerrado" },
];

export function CursoDetailSheet({
  open,
  onOpenChange,
  curso,
  currentIndex,
  totalCount,
  onNavigate,
}: CursoDetailSheetProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const updateCurso = useUpdateCurso();
  const cambiarEstado = useCambiarEstadoCurso();
  const { data: personas = [] } = usePersonas();
  const [formData, setFormData] = useState<Partial<CursoFormData>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Get matriculas for this curso
  const { data: matriculas = [] } = useMatriculasByCurso(curso?.id || "");

  // Reset form data when curso changes
  useEffect(() => {
    setFormData({});
    setIsDirty(false);
  }, [curso?.id]);

  if (!curso) return null;

  const handleFieldChange = (field: keyof CursoFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      // Handle estado change separately
      if (formData.estado && formData.estado !== curso.estado) {
        await cambiarEstado.mutateAsync({
          id: curso.id,
          estado: formData.estado as EstadoCurso,
        });
      }

      // Handle other changes
      const otherChanges = { ...formData };
      delete otherChanges.estado;

      if (Object.keys(otherChanges).length > 0) {
        await updateCurso.mutateAsync({
          id: curso.id,
          data: otherChanges,
        });
      }

      toast({ title: "Cambios guardados correctamente" });
      setFormData({});
      setIsDirty(false);
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setFormData({});
    setIsDirty(false);
  };

  const getValue = <K extends keyof Curso>(field: K): Curso[K] => {
    return (formData[field as keyof CursoFormData] as Curso[K]) ?? curso[field];
  };

  // Calculate capacity
  const ocupacion = curso.matriculasIds.length / curso.capacidadMaxima;
  const ocupacionPercent = ocupacion * 100;

  const getOcupacionColor = () => {
    if (ocupacion >= 0.9) return "text-red-600";
    if (ocupacion >= 0.7) return "text-amber-600";
    return "text-emerald-600";
  };

  const getEstadoBadgeVariant = (estado: EstadoCurso) => {
    switch (estado) {
      case "abierto":
        return "default" as const;
      case "en_progreso":
        return "secondary" as const;
      case "cerrado":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  const handleFullScreen = () => {
    if (curso) {
      onOpenChange(false);
      navigate(`/cursos/${curso.id}`);
    }
  };

  return (
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={curso.nombre}
      subtitle={`Entrenador: ${curso.entrenadorNombre}`}
      currentIndex={currentIndex}
      totalCount={totalCount}
      onNavigate={onNavigate}
      onFullScreen={handleFullScreen}
      countLabel="cursos"
      footer={
        isDirty ? (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateCurso.isPending || cambiarEstado.isPending}>
              {updateCurso.isPending || cambiarEstado.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* Capacity Overview */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className={`h-5 w-5 ${getOcupacionColor()}`} />
              <span className="font-medium">Capacidad del Curso</span>
            </div>
            <span className={`font-semibold ${getOcupacionColor()}`}>
              {curso.matriculasIds.length}/{curso.capacidadMaxima}
            </span>
          </div>
          <Progress value={ocupacionPercent} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {curso.capacidadMaxima - curso.matriculasIds.length} cupos disponibles
          </p>
        </div>

        <Separator />

        {/* Estado */}
        <DetailSection title="Estado del Curso">
          <EditableField
            label="Estado"
            value={getValue("estado")}
            displayValue={ESTADO_CURSO_LABELS[getValue("estado")]}
            onChange={(v) => handleFieldChange("estado", v)}
            type="select"
            options={ESTADO_OPTIONS}
            icon={FileCheck}
            badge
            badgeVariant={getEstadoBadgeVariant(getValue("estado"))}
          />
        </DetailSection>

        <Separator />

        {/* Información General */}
        <DetailSection title="Información General">
          <div className="space-y-4">
            <EditableField
              label="Nombre del Curso"
              value={getValue("nombre")}
              onChange={(v) => handleFieldChange("nombre", v)}
              icon={BookOpen}
            />
            <EditableField
              label="Descripción"
              value={getValue("descripcion")}
              onChange={(v) => handleFieldChange("descripcion", v)}
            />
            <EditableField
              label="Entrenador"
              value={getValue("entrenadorNombre")}
              onChange={(v) => handleFieldChange("entrenadorNombre", v)}
              icon={User}
            />
          </div>
        </DetailSection>

        <Separator />

        {/* Fechas y Duración */}
        <DetailSection title="Fechas y Duración">
          <div className="grid grid-cols-2 gap-4">
            <EditableField
              label="Fecha de Inicio"
              value={getValue("fechaInicio")}
              onChange={(v) => handleFieldChange("fechaInicio", v)}
              type="date"
              icon={Calendar}
            />
            <EditableField
              label="Fecha de Fin"
              value={getValue("fechaFin")}
              onChange={(v) => handleFieldChange("fechaFin", v)}
              type="date"
              icon={Calendar}
            />
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Duración:</span>
              <span>{curso.duracionDias} días ({curso.horasTotales}h)</span>
            </div>
          </div>
        </DetailSection>

        <Separator />

        {/* Estudiantes Inscritos */}
        <DetailSection title="Estudiantes Inscritos">
          {matriculas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay estudiantes inscritos</p>
          ) : (
            <div className="space-y-2">
              {matriculas.slice(0, 5).map((m) => {
                const persona = personas.find((p) => p.id === m.personaId);
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {persona ? `${persona.nombres} ${persona.apellidos}` : "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {persona?.numeroDocumento}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {m.estado}
                    </Badge>
                  </div>
                );
              })}
              {matriculas.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{matriculas.length - 5} estudiantes más
                </p>
              )}
            </div>
          )}
        </DetailSection>

        {/* Metadata */}
        <div className="text-xs text-muted-foreground pt-4">
          <p>Creado: {format(new Date(curso.createdAt), "d MMM yyyy, HH:mm", { locale: es })}</p>
          <p>Actualizado: {format(new Date(curso.updatedAt), "d MMM yyyy, HH:mm", { locale: es })}</p>
        </div>
      </div>
    </DetailSheet>
  );
}
