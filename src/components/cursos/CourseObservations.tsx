import { ComentariosSection } from "@/components/shared/ComentariosSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CourseObservationsProps {
  cursoId: string;
}

export function CourseObservations({ cursoId }: CourseObservationsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Observaciones del Curso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ComentariosSection
          matriculaId={cursoId}
          seccion="curso_observaciones"
          titulo="Observaciones"
        />
      </CardContent>
    </Card>
  );
}
