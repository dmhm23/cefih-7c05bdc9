import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
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
import { useToast } from "@/hooks/use-toast";
import { useUpdateCurso, useCambiarEstadoCurso } from "@/hooks/useCursos";
import { useMatriculasByCurso } from "@/hooks/useMatriculas";
import { usePersonas } from "@/hooks/usePersonas";
import { Curso, CursoFormData, ESTADO_CURSO_LABELS, EstadoCurso } from "@/types/curso";
import { resolveNivelCursoLabel, getNivelesAsOptions } from "@/utils/resolveNivelLabel";
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

// El estado 'en_progreso' se asigna automáticamente al agregar estudiantes;
// el usuario solo puede cambiar entre 'abierto' y 'cerrado' manualmente.
const ESTADO_OPTIONS = [
  { value: "abierto", label: "Abierto" },
  { value: "cerrado", label: "Cerrado" },
];

const TIPO_FORMACION_OPTIONS = getNivelesAsOptions();

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

  const { data: matriculas = [] } = useMatriculasByCurso(curso?.id || "");

  useEffect(() => {
    setFormData({});
    setIsDirty(false);
  }, [curso?.id]);

  if (!curso) return null;

  const title = `${TIPO_FORMACION_LABELS[curso.tipoFormacion]} — #${curso.numeroCurso}`;
  const subtitle = `Entrenador: ${curso.entrenadorNombre}`;

  const handleFieldChange = (field: keyof CursoFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      if (formData.estado && formData.estado !== curso.estado) {
        await cambiarEstado.mutateAsync({
          id: curso.id,
          estado: formData.estado as EstadoCurso,
        });
      }

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
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    }
  };

  const handleCancel = () => {
    setFormData({});
    setIsDirty(false);
  };

  const getValue = <K extends keyof Curso>(field: K): Curso[K] => {
    return (formData[field as keyof CursoFormData] as Curso[K]) ?? curso[field];
  };

  const getEstadoBadgeVariant = (estado: EstadoCurso) => {
    switch (estado) {
      case "abierto": return "default" as const;
      case "en_progreso": return "secondary" as const;
      case "cerrado": return "outline" as const;
      default: return "secondary" as const;
    }
  };

  const handleFullScreen = () => {
    onOpenChange(false);
    navigate(`/cursos/${curso.id}`);
  };

  return (
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      subtitle={subtitle}
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
        {/* Capacity compact */}
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-medium">{curso.matriculasIds.length}</span>
            <span className="text-muted-foreground">/{curso.capacidadMaxima} inscritos</span>
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            {curso.capacidadMaxima - curso.matriculasIds.length} cupos disponibles
          </span>
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
            editable={getValue("estado") !== "en_progreso"}
          />
          {getValue("estado") === "en_progreso" && (
            <p className="text-xs text-muted-foreground mt-1">
              El estado pasa a "En Progreso" automáticamente al inscribir estudiantes.
            </p>
          )}
        </DetailSection>

        <Separator />

        {/* Info */}
        <DetailSection title="Información General">
          <div className="space-y-4">
            <EditableField
              label="Tipo de Formación"
              value={getValue("tipoFormacion")}
              displayValue={TIPO_FORMACION_LABELS[getValue("tipoFormacion") as TipoFormacion]}
              onChange={(v) => handleFieldChange("tipoFormacion", v)}
              type="select"
              options={TIPO_FORMACION_OPTIONS}
            />
            <EditableField
              label="Número del Curso"
              value={getValue("numeroCurso")}
              onChange={(v) => handleFieldChange("numeroCurso", v)}
            />
            <EditableField
              label="Entrenador"
              value={getValue("entrenadorNombre")}
              onChange={(v) => handleFieldChange("entrenadorNombre", v)}
              icon={User}
            />
            <EditableField
              label="Supervisor"
              value={getValue("supervisorNombre") ?? ""}
              onChange={(v) => handleFieldChange("supervisorNombre", v)}
              icon={User}
            />
          </div>
        </DetailSection>

        <Separator />

        {/* Fechas */}
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

        {/* MinTrabajo summary */}
        <DetailSection title="Registro MinTrabajo">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Registro:</span>
              <span className="font-medium">{curso.minTrabajoRegistro || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha Cierre:</span>
              <span>{curso.minTrabajoFechaCierrePrincipal || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Responsable:</span>
              <span>{curso.minTrabajoResponsable || "—"}</span>
            </div>
          </div>
        </DetailSection>

        <Separator />

        {/* Students */}
        <DetailSection title="Estudiantes Inscritos">
          {matriculas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay estudiantes inscritos</p>
          ) : (
            <div className="space-y-2">
              {matriculas.slice(0, 5).map((m) => {
                const persona = personas.find((p) => p.id === m.personaId);
                return (
                  <div key={m.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {persona ? `${persona.nombres} ${persona.apellidos}` : "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">{persona?.numeroDocumento}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">{m.estado}</Badge>
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
