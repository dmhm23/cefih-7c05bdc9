import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditableField } from "@/components/shared/EditableField";
import { Curso, CursoFormData } from "@/types/curso";
import { resolveNivelCursoLabel, getNivelesAsOptions } from "@/utils/resolveNivelLabel";
import { differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { usePersonalByTipoCargo } from "@/hooks/usePersonal";

const TIPO_FORMACION_OPTIONS = getNivelesAsOptions();

interface CourseInfoCardProps {
  curso: Curso;
  formData: Partial<CursoFormData>;
  onFieldChange: (field: keyof CursoFormData, value: string | number) => void;
  readOnly?: boolean;
}

export function CourseInfoCard({ curso, formData, onFieldChange, readOnly }: CourseInfoCardProps) {
  const { data: entrenadores = [] } = usePersonalByTipoCargo('entrenador');
  const { data: supervisores = [] } = usePersonalByTipoCargo('supervisor');

  const entrenadorOptions = useMemo(() =>
    entrenadores.map((e) => ({ value: e.id, label: `${e.nombres} ${e.apellidos}` })),
    [entrenadores]
  );

  const supervisorOptions = useMemo(() =>
    supervisores.map((s) => ({ value: s.id, label: `${s.nombres} ${s.apellidos}` })),
    [supervisores]
  );

  const handleEntrenadorChange = (entrenadorId: string) => {
    const selected = entrenadores.find((e) => e.id === entrenadorId);
    if (selected) {
      onFieldChange("entrenadorId", entrenadorId);
      onFieldChange("entrenadorNombre", `${selected.nombres} ${selected.apellidos}`);
    }
  };

  const handleSupervisorChange = (supervisorId: string) => {
    const selected = supervisores.find((s) => s.id === supervisorId);
    if (selected) {
      onFieldChange("supervisorId", supervisorId);
      onFieldChange("supervisorNombre", `${selected.nombres} ${selected.apellidos}`);
    }
  };

  const handleFechaChange = (campo: "fechaInicio" | "fechaFin", nuevoValor: string) => {
    onFieldChange(campo, nuevoValor);
    const inicio = campo === "fechaInicio" ? nuevoValor : (formData.fechaInicio ?? curso.fechaInicio);
    const fin    = campo === "fechaFin"    ? nuevoValor : (formData.fechaFin    ?? curso.fechaFin);
    if (inicio && fin) {
      const dias = differenceInCalendarDays(new Date(fin), new Date(inicio));
      if (dias >= 1) onFieldChange("duracionDias", dias);
    }
  };

  const getValue = (field: keyof Curso): string => {
    const val = (formData[field as keyof CursoFormData] ?? curso[field]) as string | number | undefined;
    return val?.toString() ?? "";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Información del Curso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <EditableField
            label="Tipo de Formación"
            value={getValue("tipoFormacion")}
            displayValue={resolveNivelCursoLabel(getValue("tipoFormacion"))}
            onChange={(v) => onFieldChange("tipoFormacion", v)}
            type="select"
            options={TIPO_FORMACION_OPTIONS}
            editable={!readOnly}
          />
          <EditableField
            label="Número del Curso"
            value={getValue("numeroCurso")}
            onChange={(v) => onFieldChange("numeroCurso", v)}
            editable={!readOnly}
          />
          <EditableField
            label="Fecha Inicio"
            value={getValue("fechaInicio")}
            onChange={(v) => handleFechaChange("fechaInicio", v)}
            type="date"
            editable={!readOnly}
          />
          <EditableField
            label="Fecha Fin"
            value={getValue("fechaFin")}
            onChange={(v) => handleFechaChange("fechaFin", v)}
            type="date"
            editable={!readOnly}
          />
          <EditableField
            label="Duración (días)"
            value={getValue("duracionDias")}
            onChange={(v) => onFieldChange("duracionDias", Number(v) || 0)}
            editable={!readOnly}
          />
          <EditableField
            label="Horas Totales"
            value={getValue("horasTotales")}
            onChange={(v) => onFieldChange("horasTotales", Number(v) || 0)}
            editable={!readOnly}
          />
          <EditableField
            label="Entrenador"
            value={getValue("entrenadorId")}
            displayValue={getValue("entrenadorNombre")}
            onChange={handleEntrenadorChange}
            type="select"
            options={entrenadorOptions}
            editable={!readOnly}
          />
          <EditableField
            label="Supervisor"
            value={getValue("supervisorId")}
            displayValue={getValue("supervisorNombre")}
            onChange={handleSupervisorChange}
            type="select"
            options={supervisorOptions}
            editable={!readOnly}
          />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Última actualización</p>
            <p className="text-sm">{format(new Date(curso.updatedAt), "d MMM yyyy, HH:mm", { locale: es })}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
