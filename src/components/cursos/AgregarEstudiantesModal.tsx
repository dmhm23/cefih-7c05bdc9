import { useState, useMemo } from "react";
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { X, Search, UserPlus, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useMatriculasDisponiblesParaCurso } from "@/hooks/useMatriculas";
import { useNivelesFormacion } from "@/hooks/useNivelesFormacion";
import { useAgregarEstudiantesCurso } from "@/hooks/useCursos";
import { useToast } from "@/hooks/use-toast";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface AgregarEstudiantesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cursoId: string;
  matriculasActuales: string[];
  nivelFormacion: string;
}

// Map frontend labels to DB enum values for fallback matching
const TIPO_FE_TO_DB: Record<string, string> = {
  trabajador_autorizado: 'formacion_inicial',
  reentrenamiento: 'reentrenamiento',
  jefe_area: 'jefe_area',
  coordinador_ta: 'coordinador_alturas',
};

export function AgregarEstudiantesModal({
  open,
  onOpenChange,
  cursoId,
  matriculasActuales: _matriculasActuales,
  nivelFormacion,
}: AgregarEstudiantesModalProps) {
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState<string[]>([]);

  const { data: niveles = [], isLoading: nivelesLoading } = useNivelesFormacion();
  const agregarEstudiantes = useAgregarEstudiantesCurso();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();

  // Resolver IDs válidos de nivel de formación
  const nivelesValidos = useMemo(() => {
    if (UUID_REGEX.test(nivelFormacion)) {
      return [nivelFormacion];
    }
    const dbValue = TIPO_FE_TO_DB[nivelFormacion] || nivelFormacion;
    return niveles
      .filter((n) => n.tipoFormacion === nivelFormacion || n.tipoFormacion === dbValue)
      .map((n) => n.id);
  }, [nivelFormacion, niveles]);

  // Solo consultar cuando el modal está abierto y ya conocemos los niveles
  const {
    data: disponiblesData,
    isLoading: disponiblesLoading,
  } = useMatriculasDisponiblesParaCurso(nivelesValidos, open && !nivelesLoading);

  const disponibles = disponiblesData?.rows ?? [];
  const personasResumen = disponiblesData?.personasResumen ?? {};

  const isLoading = open && (nivelesLoading || disponiblesLoading);

  const getPersona = (personaId: string) => personasResumen[personaId];

  // Filtrado por cédula o nombre
  const filtradas = useMemo(() => {
    if (!busqueda.trim()) return disponibles;
    const q = busqueda.toLowerCase();
    return disponibles.filter((m) => {
      const persona = getPersona(m.personaId);
      if (!persona) return false;
      return (
        persona.numeroDocumento.toLowerCase().includes(q) ||
        `${persona.nombres} ${persona.apellidos}`.toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disponibles, busqueda, personasResumen]);

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleConfirmar = async () => {
    if (seleccionados.length === 0) return;
    try {
      await agregarEstudiantes.mutateAsync({
        cursoId,
        matriculaIds: seleccionados,
      });
      toast({
        title: `${seleccionados.length} estudiante(s) agregado(s) al curso`,
      });
      logActivity({ action: "crear", module: "cursos", description: `Agregó ${seleccionados.length} estudiante(s) al curso`, entityType: "curso", entityId: cursoId });
      setSeleccionados([]);
      setBusqueda("");
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Error al agregar estudiantes",
        description: err?.message || "Error desconocido",
        variant: "destructive",
      });
    }
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      setSeleccionados([]);
      setBusqueda("");
    }
    onOpenChange(value);
  };

  const seleccionadosData = disponibles.filter((m) =>
    seleccionados.includes(m.id)
  );

  const getDocsPendientes = (documentos: { estado: string }[] = []) =>
    documentos.filter((d) => d.estado === "pendiente").length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Agregar Estudiantes al Curso
          </DialogTitle>
          <DialogDescription>
            Mostrando matrículas disponibles con el mismo nivel de formación del curso.
          </DialogDescription>
        </DialogHeader>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cédula o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
            disabled={isLoading}
          />
        </div>

        {/* Contador */}
        {seleccionados.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {seleccionados.length} seleccionado(s)
            </Badge>
          </div>
        )}

        {/* Lista de matrículas disponibles */}
        <ScrollArea className="flex-1 min-h-0 max-h-[300px] border rounded-md">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-4 w-4" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : filtradas.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No hay matrículas disponibles para este nivel de formación
            </div>
          ) : (
            <div className="divide-y">
              {filtradas.map((m) => {
                const persona = getPersona(m.personaId);
                const isSelected = seleccionados.includes(m.id);
                const docsPendientes = getDocsPendientes(m.documentos);
                return (
                  <label
                    key={m.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSeleccion(m.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {persona ? `${persona.nombres} ${persona.apellidos}` : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {persona?.numeroDocumento}
                      </p>
                      {docsPendientes > 0 && (
                        <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="h-3 w-3" />
                          Pendiente de documentos ({docsPendientes})
                        </p>
                      )}
                    </div>
                    <StatusBadge status={m.estado} />
                  </label>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Panel de seleccionados */}
        {seleccionadosData.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Seleccionados
            </p>
            <div className="flex flex-wrap gap-2">
              {seleccionadosData.map((m) => {
                const persona = getPersona(m.personaId);
                return (
                  <Badge
                    key={m.id}
                    variant="outline"
                    className="flex items-center gap-1 pr-1"
                  >
                    <span className="text-xs">
                      {persona ? `${persona.nombres} ${persona.apellidos}` : "—"}
                    </span>
                    <button
                      onClick={() => toggleSeleccion(m.id)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={seleccionados.length === 0 || agregarEstudiantes.isPending}
          >
            {agregarEstudiantes.isPending
              ? "Agregando..."
              : `Agregar ${seleccionados.length} estudiante(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
