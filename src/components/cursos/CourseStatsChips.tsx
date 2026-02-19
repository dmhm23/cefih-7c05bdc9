import { Users, CheckCircle, Clock, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CourseStatsChipsProps {
  total: number;
  completas: number;
  pendientes: number;
  certificadas: number;
}

export function CourseStatsChips({ total, completas, pendientes, certificadas }: CourseStatsChipsProps) {
  const stats = [
    { label: "Total", value: total, icon: Users, color: "text-foreground" },
    { label: "Completas", value: completas, icon: CheckCircle, color: "text-emerald-600" },
    { label: "Pendientes", value: pendientes, icon: Clock, color: "text-amber-600" },
    { label: "Certificadas", value: certificadas, icon: Award, color: "text-primary" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Resumen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-2 p-2 rounded-md bg-muted/40">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <div>
                <p className="text-lg font-semibold leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
