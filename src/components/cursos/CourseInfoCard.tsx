import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditableField } from "@/components/shared/EditableField";
import { Curso, CursoFormData, TIPO_FORMACION_LABELS } from "@/types/curso";
import { differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";

interface CourseInfoCardProps {
  curso: Curso;
  formData: Partial<CursoFormData>;
  onFieldChange: (field: keyof CursoFormData, value: string | number) => void;
  readOnly?: boolean;
}

export function CourseInfoCard({ curso, formData, onFieldChange, readOnly }: CourseInfoCardProps) {
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
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Tipo de Formación</p>
            <p className="text-sm font-medium">{TIPO_FORMACION_LABELS[curso.tipoFormacion]}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Número del Curso</p>
            <p className="text-sm font-medium">#{curso.numeroCurso}</p>
          </div>
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
            value={getValue("entrenadorNombre")}
            onChange={(v) => onFieldChange("entrenadorNombre", v)}
            editable={!readOnly}
          />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Supervisor</p>
            <p className="text-sm">{curso.supervisorNombre || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Última actualización</p>
            <p className="text-sm">{format(new Date(curso.updatedAt), "d MMM yyyy, HH:mm", { locale: es })}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
