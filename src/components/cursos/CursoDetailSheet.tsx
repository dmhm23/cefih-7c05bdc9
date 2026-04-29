import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Users,
  User,
} from "lucide-react";
import { DetailSheet, DetailSection } from "@/components/shared/DetailSheet";
import { EditableField } from "@/components/shared/EditableField";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUpdateCurso } from "@/hooks/useCursos";
import { useMatriculasByCurso } from "@/hooks/useMatriculas";
import { usePersonasByIds } from "@/hooks/usePersonas";
import { useNivelesFormacion } from "@/hooks/useNivelesFormacion";
import { usePersonalByTipoCargo } from "@/hooks/usePersonal";
import { Curso, CursoFormData } from "@/types/curso";
import { useResolveNivel } from "@/hooks/useResolveNivel";
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
  const { data: niveles = [] } = useNivelesFormacion();
  const { data: entrenadores = [] } = usePersonalByTipoCargo('entrenador');
  const { data: supervisores = [] } = usePersonalByTipoCargo('supervisor');
  const [formData, setFormData] = useState<Partial<CursoFormData>>({});
  const [isDirty, setIsDirty] = useState(false);

  const resolveNivel = useResolveNivel();

  const tipoFormacionOptions = useMemo(
    () => niveles.map((n) => ({ value: n.id, label: n.nombreNivel })),
    [niveles]
  );

  const entrenadorOptions = useMemo(() =>
    entrenadores.map((e) => ({ value: e.id, label: `${e.nombres} ${e.apellidos}` })),
    [entrenadores]
  );

  const supervisorOptions = useMemo(() =>
    supervisores.map((s) => ({ value: s.id, label: `${s.nombres} ${s.apellidos}` })),
    [supervisores]
  );

  const { data: matriculas = [], isLoading: matriculasLoading } = useMatriculasByCurso(curso?.id || "");

  // Cargar SOLO las personas inscritas en este curso (batch por IDs)
  const personaIds = useMemo(() => matriculas.map((m) => m.personaId), [matriculas]);
  const { data: personas = [], isLoading: personasLoading } = usePersonasByIds(personaIds);
  const personaMap = useMemo(() => new Map(personas.map((p) => [p.id, p])), [personas]);
  const personasReady = !matriculasLoading && !personasLoading;

  const nivelLabel = resolveNivel(curso?.nivelFormacionId || curso?.tipoFormacion);

  useEffect(() => {
    setFormData({});
    setIsDirty(false);
  }, [curso?.id]);

  if (!curso) return null;

  const title = `${curso.numeroCurso}—${nivelLabel}`;
  const subtitle = `Entrenador: ${curso.entrenadorNombre}`;

  const handleFieldChange = (field: keyof CursoFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      if (Object.keys(formData).length > 0) {
        await updateCurso.mutateAsync({
          id: curso.id,
          data: formData,
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
            <Button onClick={handleSave} disabled={updateCurso.isPending}>
              {updateCurso.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-6">

        <Separator />

        {/* Info */}
        <DetailSection title="Información General">
          <div className="space-y-4">
            <EditableField
              label="Tipo de Formación"
              value={formData.nivelFormacionId ?? curso?.nivelFormacionId ?? ""}
              displayValue={nivelLabel}
              onChange={(v) => {
                handleFieldChange("nivelFormacionId", v);
                handleFieldChange("tipoFormacion", v);
              }}
              type="select"
              options={tipoFormacionOptions}
            />
            <EditableField
              label="Número del Curso"
              value={getValue("numeroCurso")}
              onChange={(v) => handleFieldChange("numeroCurso", v)}
            />
            <EditableField
              label="Entrenador"
              value={getValue("entrenadorId") ?? ""}
              displayValue={getValue("entrenadorNombre")}
              onChange={(v) => {
                const selected = entrenadores.find((e) => e.id === v);
                if (selected) {
                  handleFieldChange("entrenadorId", v);
                  handleFieldChange("entrenadorNombre", `${selected.nombres} ${selected.apellidos}`);
                }
              }}
              type="select"
              options={entrenadorOptions}
              icon={User}
            />
            <EditableField
              label="Supervisor"
              value={getValue("supervisorId") ?? ""}
              displayValue={getValue("supervisorNombre") ?? ""}
              onChange={(v) => {
                const selected = supervisores.find((s) => s.id === v);
                if (selected) {
                  handleFieldChange("supervisorId", v);
                  handleFieldChange("supervisorNombre", `${selected.nombres} ${selected.apellidos}`);
                }
              }}
              type="select"
              options={supervisorOptions}
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
        <DetailSection title={`Estudiantes Inscritos (${curso.matriculasIds.length}/${curso.capacidadMaxima})`}>
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{curso.matriculasIds.length} inscritos · {curso.capacidadMaxima - curso.matriculasIds.length} cupos disponibles</span>
          </div>
          {matriculasLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : matriculas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay estudiantes inscritos</p>
          ) : (
            <div className="space-y-2">
              {matriculas.slice(0, 5).map((m) => {
                const persona = personaMap.get(m.personaId);
                const nombreMostrado = persona
                  ? `${persona.nombres} ${persona.apellidos}`
                  : personasReady
                  ? "Persona no encontrada"
                  : "Cargando…";
                return (
                  <div key={m.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{nombreMostrado}</p>
                        <p className="text-xs text-muted-foreground">
                          {persona?.numeroDocumento ?? (personasReady ? "—" : "")}
                        </p>
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
