import { useState, useEffect, useRef } from "react";
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
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
import { JustificacionEdicionDialog } from "@/components/cursos/JustificacionEdicionDialog";
import { GenerarPdfsDialog } from "@/components/cursos/GenerarPdfsDialog";
import { useCurso, useUpdateCurso, useCursoEstadisticas, useCambiarEstadoCurso } from "@/hooks/useCursos";
import { useMatriculasByCurso } from "@/hooks/useMatriculas";
import { usePersonasByIds } from "@/hooks/usePersonas";
import { useEmpresas } from "@/hooks/useEmpresas";
import { useCodigosCurso } from "@/hooks/useCodigosCurso";
import { CursoFormData, ESTADO_CURSO_LABELS } from "@/types/curso";
import { useToast } from "@/hooks/use-toast";
import { generateMinTrabajoCsv, generateDummyCsv, downloadCsv, validateMinTrabajoData } from "@/utils/csvMinTrabajo";
import { ExportarListadoDialog } from "@/components/cursos/ExportarListadoDialog";

export default function CursoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();

  const { data: curso, isLoading } = useCurso(id || "");
  const { data: estadisticas } = useCursoEstadisticas(id || "");
  const { data: matriculas = [], isLoading: matriculasLoading } = useMatriculasByCurso(id || "");
  // Carga acotada: solo las personas inscritas en este curso (batch por IDs).
  const personaIds = matriculas.map((m) => m.personaId);
  const { data: personas = [], isLoading: personasLoading } = usePersonasByIds(personaIds);
  const { data: empresas = [] } = useEmpresas();
  const personasReady = !matriculasLoading && !personasLoading;
  const updateCurso = useUpdateCurso();
  const cambiarEstado = useCambiarEstadoCurso();
  const { codigos: codigosEstudiante } = useCodigosCurso(curso);

  const [formData, setFormData] = useState<Partial<CursoFormData>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [justificacionDialogOpen, setJustificacionDialogOpen] = useState(false);
  const [generarPdfsOpen, setGenerarPdfsOpen] = useState(false);
  const [exportarListadoOpen, setExportarListadoOpen] = useState(false);

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

  // Cursos cerrados permiten edición pero requieren justificación al guardar
  const isReadOnly = false;
  const isClosed = curso.estado === "cerrado";

  const handleFieldChange = (field: keyof CursoFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async (justificacion?: string) => {
    try {
      await updateCurso.mutateAsync({ id: curso.id, data: formData, justificacion });
      toast({ title: "Cambios guardados correctamente" });
      logActivity({ action: "editar", module: "cursos", description: `Editó el curso ${curso.numeroCurso || ''}—${curso.nombre}`, entityType: "curso", entityId: curso.id, metadata: { campos_modificados: Object.keys(formData), justificacion: justificacion || undefined } });
      setFormData({});
      setIsDirty(false);
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error?.message || "Revise los campos e intente nuevamente",
        variant: "destructive",
      });
    }
  };

  const handleSaveClick = () => {
    if (isClosed) {
      setJustificacionDialogOpen(true);
    } else {
      handleSave();
    }
  };

  const handleCancel = () => {
    setFormData({});
    setIsDirty(false);
  };

  const handleScrollToMinTrabajo = () => {
    minTrabajoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleDownloadCsvMinTrabajo = () => {
    const isDummy = matriculas.length === 0;
    const content = isDummy
      ? generateDummyCsv()
      : generateMinTrabajoCsv(matriculas, personas, curso);
    const filename = `Curso_${curso.numeroCurso}_MinTrabajo.csv`;
    downloadCsv(content, filename);
    toast({
      title: isDummy ? "CSV de prueba generado" : "CSV MinTrabajo descargado",
      description: isDummy ? "Se generó un archivo con datos de ejemplo (3 filas dummy)." : `${matriculas.length} registro(s) exportados.`,
    });
    logActivity({ action: "exportar", module: "cursos", description: `Exportó CSV MinTrabajo del curso ${curso.numeroCurso || ''}—${curso.nombre} (${matriculas.length} registros)`, entityType: "curso", entityId: curso.id, metadata: { registros: matriculas.length, tipo: "mintrabajo" } });
  };

  const handleExportarListado = () => setExportarListadoOpen(true);

  const handleCambiarEstado = async (nuevoEstado: "abierto" | "en_progreso") => {
    try {
      await cambiarEstado.mutateAsync({ id: curso.id, estado: nuevoEstado });
      toast({ title: `Estado cambiado a ${ESTADO_CURSO_LABELS[nuevoEstado]}` });
      logActivity({ action: "editar", module: "cursos", description: `Cambió estado del curso ${curso.numeroCurso || ''}—${curso.nombre} a "${ESTADO_CURSO_LABELS[nuevoEstado]}"`, entityType: "curso", entityId: curso.id, metadata: { estado_anterior: curso.estado, estado_nuevo: nuevoEstado } });
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
        onDownloadCsvMinTrabajo={handleDownloadCsvMinTrabajo}
        onExportarListado={handleExportarListado}
        onGenerarPdfs={() => setGenerarPdfsOpen(true)}
      />


      {/* Card 1 — Info */}
      <CourseInfoCard
        curso={curso}
        formData={formData}
        onFieldChange={handleFieldChange}
        readOnly={isReadOnly}
      />

      {/* Card 2 — Enrollments Table */}
      <EnrollmentsTable
        curso={curso}
        matriculas={matriculas}
        personas={personas}
        personasLoading={!personasReady}
        readOnly={isReadOnly}
      />

      {/* Card 3 — MinTrabajo */}
      <div ref={minTrabajoRef}>
        <MinTrabajoCard curso={curso} readOnly={isReadOnly} />
      </div>

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
          <Button size="sm" onClick={handleSaveClick} disabled={updateCurso.isPending}>
            {updateCurso.isPending ? "Guardando..." : isClosed ? "Guardar (requiere justificación)" : "Guardar Cambios"}
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

      {/* Justification Dialog for editing closed courses */}
      <JustificacionEdicionDialog
        open={justificacionDialogOpen}
        onOpenChange={setJustificacionDialogOpen}
        onConfirm={(justificacion) => {
          setJustificacionDialogOpen(false);
          handleSave(justificacion);
        }}
        isPending={updateCurso.isPending}
      />

      {/* Export Listado Dialog */}
      <ExportarListadoDialog
        open={exportarListadoOpen}
        onOpenChange={setExportarListadoOpen}
        curso={curso}
        matriculas={matriculas}
        personas={personas}
        codigosEstudiante={codigosEstudiante}
      />

      {/* Generate PDFs Dialog */}
      <GenerarPdfsDialog
        open={generarPdfsOpen}
        onOpenChange={setGenerarPdfsOpen}
        curso={curso}
        matriculas={matriculas}
        personas={personas}
      />
    </div>
  );
}
