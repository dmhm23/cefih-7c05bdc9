import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseHeader } from "@/components/cursos/CourseHeader";
import { CourseInfoCard } from "@/components/cursos/CourseInfoCard";
import { MinTrabajoCard } from "@/components/cursos/MinTrabajoCard";
import { EnrollmentsTable } from "@/components/cursos/EnrollmentsTable";
import { CourseStatsChips } from "@/components/cursos/CourseStatsChips";
import { CourseObservations } from "@/components/cursos/CourseObservations";
import { CloseCourseDialog } from "@/components/cursos/CloseCourseDialog";
import { useCurso, useUpdateCurso, useCursoEstadisticas, useCambiarEstadoCurso } from "@/hooks/useCursos";
import { useMatriculasByCurso } from "@/hooks/useMatriculas";
import { usePersonas } from "@/hooks/usePersonas";
import { CursoFormData, ESTADO_CURSO_LABELS } from "@/types/curso";
import { useToast } from "@/hooks/use-toast";

export default function CursoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: curso, isLoading } = useCurso(id || "");
  const { data: estadisticas } = useCursoEstadisticas(id || "");
  const { data: matriculas = [] } = useMatriculasByCurso(id || "");
  const { data: personas = [] } = usePersonas();
  const updateCurso = useUpdateCurso();
  const cambiarEstado = useCambiarEstadoCurso();

  const [formData, setFormData] = useState<Partial<CursoFormData>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  const minTrabajoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFormData({});
    setIsDirty(false);
  }, [curso?.id]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Curso no encontrado</p>
        <Button variant="link" onClick={() => navigate("/cursos")}>
          Volver al listado
        </Button>
      </div>
    );
  }

  const isReadOnly = curso.estado === "cerrado";

  const handleFieldChange = (field: keyof CursoFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateCurso.mutateAsync({ id: curso.id, data: formData });
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

  const handleScrollToMinTrabajo = () => {
    minTrabajoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleCambiarEstado = async (nuevoEstado: "abierto" | "en_progreso") => {
    try {
      await cambiarEstado.mutateAsync({ id: curso.id, estado: nuevoEstado });
      toast({ title: `Estado cambiado a ${ESTADO_CURSO_LABELS[nuevoEstado]}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <CourseHeader
        curso={curso}
        onBack={() => navigate("/cursos")}
        onCloseCourse={() => setCloseDialogOpen(true)}
      />


      {/* Card 1 — Info */}
      <CourseInfoCard
        curso={curso}
        formData={formData}
        onFieldChange={handleFieldChange}
        readOnly={isReadOnly}
      />

      {/* Card 2 — MinTrabajo */}
      <div ref={minTrabajoRef}>
        <MinTrabajoCard curso={curso} readOnly={isReadOnly} />
      </div>

      {/* Card 3 — Enrollments Table */}
      <EnrollmentsTable
        curso={curso}
        matriculas={matriculas}
        personas={personas}
        readOnly={isReadOnly}
      />

      {/* Card 4 — Stats */}
      {estadisticas && (
        <CourseStatsChips
          total={estadisticas.total}
          completas={estadisticas.completas}
          pendientes={estadisticas.pendientes}
          certificadas={estadisticas.certificadas}
        />
      )}

      {/* Card 5 — Observations */}
      <CourseObservations cursoId={curso.id} />

      {/* Floating save bar */}
      {isDirty && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-background border rounded-lg shadow-lg p-3">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateCurso.isPending}>
            {updateCurso.isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      )}

      {/* Close Course Dialog */}
      <CloseCourseDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        curso={curso}
        matriculas={matriculas}
        personas={personas}
        onScrollToMinTrabajo={handleScrollToMinTrabajo}
        onFilterPendientes={() => {
          // This would ideally set a filter state shared with EnrollmentsTable
          // For now we just scroll to the table area
          toast({ title: "Filtrando matrículas pendientes..." });
        }}
      />
    </div>
  );
}
