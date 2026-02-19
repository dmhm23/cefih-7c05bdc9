import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Plus, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AgregarEstudiantesModal } from "@/components/cursos/AgregarEstudiantesModal";
import { Curso } from "@/types/curso";
import { Matricula } from "@/types/matricula";
import { Persona } from "@/types/persona";
import { useRemoverEstudianteCurso } from "@/hooks/useCursos";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface EnrollmentsTableProps {
  curso: Curso;
  matriculas: Matricula[];
  personas: Persona[];
  readOnly?: boolean;
}

export function EnrollmentsTable({ curso, matriculas, personas, readOnly }: EnrollmentsTableProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const removerEstudiante = useRemoverEstudianteCurso();
  const [filter, setFilter] = useState<"todos" | "pendientes">("todos");
  const [modalAgregarOpen, setModalAgregarOpen] = useState(false);
  const [estudianteAEliminar, setEstudianteAEliminar] = useState<{ id: string; nombre: string } | null>(null);

  const getPersona = (personaId: string) => personas.find((p) => p.id === personaId);

  const filtered = filter === "pendientes"
    ? matriculas.filter((m) => m.estado === "creada" || m.estado === "pendiente")
    : matriculas;

  const getArlDate = (m: Matricula) => {
    const doc = m.documentos?.find((d) => d.tipo === "arl");
    return doc?.fechaInicioCobertura || doc?.fechaCarga || "—";
  };

  const getExamDate = (m: Matricula) => {
    const doc = m.documentos?.find((d) => d.tipo === "examen_medico");
    return doc?.fechaDocumento || doc?.fechaCarga || "—";
  };

  const getDocStatus = (m: Matricula) => {
    if (!m.documentos || m.documentos.length === 0) return "pendiente";
    const pendientes = m.documentos.filter((d) => d.estado === "pendiente" && !d.opcional);
    if (pendientes.length === 0) return "completo";
    return "pendiente";
  };

  const getFinancialStatus = (m: Matricula) => {
    if (m.pagado) return "pagado";
    if (m.abono && m.abono > 0) return "abonado";
    return "pendiente";
  };

  const pendientesCount = matriculas.filter((m) => m.estado === "creada" || m.estado === "pendiente").length;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Estudiantes Inscritos
              </CardTitle>
              <Badge variant="secondary" className="text-xs">{matriculas.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border overflow-hidden text-xs">
                <button
                  className={`px-3 py-1 transition-colors ${filter === "todos" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                  onClick={() => setFilter("todos")}
                >
                  Todos
                </button>
                <button
                  className={`px-3 py-1 transition-colors ${filter === "pendientes" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                  onClick={() => setFilter("pendientes")}
                >
                  Pendientes ({pendientesCount})
                </button>
              </div>
              {!readOnly && (
                <Button variant="outline" size="sm" onClick={() => setModalAgregarOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
              {filter === "pendientes" ? "No hay matrículas pendientes" : "No hay estudiantes inscritos"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 pr-3 font-medium">Nombre</th>
                    <th className="text-left py-2 pr-3 font-medium">Empresa</th>
                    <th className="text-left py-2 pr-3 font-medium">Cobertura ARL</th>
                    <th className="text-left py-2 pr-3 font-medium">Examen</th>
                    <th className="text-left py-2 pr-3 font-medium">Documental</th>
                    <th className="text-left py-2 pr-3 font-medium">Financiero</th>
                    <th className="text-right py-2 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const persona = getPersona(m.personaId);
                    const docStatus = getDocStatus(m);
                    const finStatus = getFinancialStatus(m);
                    return (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-3">
                          <p className="font-medium">{persona ? `${persona.nombres} ${persona.apellidos}` : "N/A"}</p>
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {m.empresaNombre || "Independiente"}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {getArlDate(m) !== "—" ? format(new Date(getArlDate(m)), "dd/MM/yyyy") : "—"}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {getExamDate(m) !== "—" ? format(new Date(getExamDate(m)), "dd/MM/yyyy") : "—"}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge variant={docStatus === "completo" ? "default" : "outline"} className="text-xs">
                            {docStatus === "completo" ? "Completo" : "Pendiente"}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3">
                          <Badge
                            variant={finStatus === "pagado" ? "default" : "outline"}
                            className="text-xs"
                          >
                            {finStatus === "pagado" ? "Pagado" : finStatus === "abonado" ? "Abonado" : "Pendiente"}
                          </Badge>
                        </td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => navigate(`/matriculas/${m.id}`)}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                            {!readOnly && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  setEstudianteAEliminar({
                                    id: m.id,
                                    nombre: persona ? `${persona.nombres} ${persona.apellidos}` : m.id,
                                  });
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AgregarEstudiantesModal
        open={modalAgregarOpen}
        onOpenChange={setModalAgregarOpen}
        cursoId={curso.id}
        matriculasActuales={curso.matriculasIds}
      />

      <ConfirmDialog
        open={!!estudianteAEliminar}
        onOpenChange={(open) => !open && setEstudianteAEliminar(null)}
        title="Remover estudiante"
        description={`¿Remover a ${estudianteAEliminar?.nombre} de este curso?`}
        confirmText="Remover"
        variant="destructive"
        onConfirm={async () => {
          if (!estudianteAEliminar) return;
          try {
            await removerEstudiante.mutateAsync({
              cursoId: curso.id,
              matriculaId: estudianteAEliminar.id,
            });
            toast({ title: "Estudiante removido" });
          } catch {
            toast({ title: "Error al remover", variant: "destructive" });
          }
          setEstudianteAEliminar(null);
        }}
      />
    </>
  );
}
