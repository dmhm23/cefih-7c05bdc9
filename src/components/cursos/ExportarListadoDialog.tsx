import { useState, useMemo } from "react";
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download } from "lucide-react";
import { Curso } from "@/types/curso";
import { Matricula } from "@/types/matricula";
import { Persona } from "@/types/persona";
import { useResolveNivel } from "@/hooks/useResolveNivel";
import { capitalize, findLabel, cleanDocumento, formatDate, downloadCsv } from "@/utils/csvMinTrabajo";
import {
  TIPOS_DOCUMENTO,
  GENEROS,
  NIVELES_EDUCATIVOS,
  PAISES,
  AREAS_TRABAJO,
  SECTORES_ECONOMICOS,
  ARL_OPTIONS,
  EPS_OPTIONS,
} from "@/data/formOptions";
import { useToast } from "@/hooks/use-toast";

interface ExportarListadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  curso: Curso;
  matriculas: Matricula[];
  personas: Persona[];
}

interface ColumnDef {
  key: string;
  header: string;
  group: string;
  defaultSelected: boolean;
  resolver: (persona: Persona, matricula: Matricula, curso: Curso, resolveNivel: (id?: string | null) => string) => string;
}

const COLUMN_CATALOG: ColumnDef[] = [
  // Persona
  { key: "p_nombre_completo", header: "Nombre Completo", group: "Persona", defaultSelected: true,
    resolver: (p) => capitalize(`${p.nombres} ${p.apellidos}`) },
  { key: "p_tipo_doc", header: "Tipo Documento", group: "Persona", defaultSelected: false,
    resolver: (p) => findLabel([...TIPOS_DOCUMENTO], p.tipoDocumento) },
  { key: "p_numero_doc", header: "Número Documento", group: "Persona", defaultSelected: true,
    resolver: (p) => cleanDocumento(p.numeroDocumento) },
  { key: "p_nombres", header: "Nombres", group: "Persona", defaultSelected: false,
    resolver: (p) => capitalize(p.nombres) },
  { key: "p_apellidos", header: "Apellidos", group: "Persona", defaultSelected: false,
    resolver: (p) => capitalize(p.apellidos) },
  { key: "p_genero", header: "Género", group: "Persona", defaultSelected: false,
    resolver: (p) => findLabel([...GENEROS], p.genero) },
  { key: "p_fecha_nac", header: "Fecha Nacimiento", group: "Persona", defaultSelected: false,
    resolver: (p) => formatDate(p.fechaNacimiento) },
  { key: "p_pais", header: "País Nacimiento", group: "Persona", defaultSelected: false,
    resolver: (p) => findLabel([...PAISES], p.paisNacimiento) },
  { key: "p_rh", header: "RH", group: "Persona", defaultSelected: false,
    resolver: (p) => p.rh || "" },
  { key: "p_nivel_edu", header: "Nivel Educativo", group: "Persona", defaultSelected: false,
    resolver: (p) => findLabel([...NIVELES_EDUCATIVOS], p.nivelEducativo) },
  { key: "p_email", header: "Email", group: "Persona", defaultSelected: false,
    resolver: (p) => p.email || "" },
  { key: "p_telefono", header: "Teléfono", group: "Persona", defaultSelected: false,
    resolver: (p) => p.telefono || "" },
  { key: "p_emergencia_nombre", header: "Contacto Emergencia - Nombre", group: "Persona", defaultSelected: false,
    resolver: (p) => (p.contactoEmergencia as any)?.nombre || "" },
  { key: "p_emergencia_tel", header: "Contacto Emergencia - Teléfono", group: "Persona", defaultSelected: false,
    resolver: (p) => (p.contactoEmergencia as any)?.telefono || "" },
  { key: "p_emergencia_parentesco", header: "Contacto Emergencia - Parentesco", group: "Persona", defaultSelected: false,
    resolver: (p) => (p.contactoEmergencia as any)?.parentesco || "" },

  // Matrícula
  { key: "m_estado", header: "Estado Matrícula", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => capitalize(m.estado) },
  { key: "m_tipo_vinculacion", header: "Tipo Vinculación", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => capitalize(m.tipoVinculacion || "") },
  { key: "m_empresa", header: "Empresa", group: "Matrícula", defaultSelected: true,
    resolver: (_p, m) => capitalize(m.empresaNombre || "Independiente") },
  { key: "m_nit", header: "NIT", group: "Matrícula", defaultSelected: true,
    resolver: (_p, m) => m.empresaNit || "" },
  { key: "m_representante", header: "Representante Legal", group: "Matrícula", defaultSelected: true,
    resolver: (_p, m) => capitalize(m.empresaRepresentanteLegal || "") },
  { key: "m_cargo", header: "Cargo", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => capitalize(m.empresaCargo || "") },
  { key: "m_arl", header: "ARL", group: "Matrícula", defaultSelected: true,
    resolver: (_p, m) => findLabel([...ARL_OPTIONS], m.arl) },
  { key: "m_eps", header: "EPS", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => findLabel([...EPS_OPTIONS], m.eps) },
  { key: "m_sector", header: "Sector Económico", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => findLabel([...SECTORES_ECONOMICOS], m.sectorEconomico) },
  { key: "m_area", header: "Área de Trabajo", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => findLabel([...AREAS_TRABAJO], m.areaTrabajo) },
  { key: "m_valor_cupo", header: "Valor Cupo", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => String(m.valorCupo ?? 0) },
  { key: "m_abono", header: "Abono", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => String(m.abono ?? 0) },
  { key: "m_pagado", header: "Pagado", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => m.pagado ? "Sí" : "No" },
  { key: "m_fecha_inicio", header: "Fecha Inicio Matrícula", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => formatDate(m.fechaInicio) },
  { key: "m_fecha_fin", header: "Fecha Fin Matrícula", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => formatDate(m.fechaFin) },
  { key: "m_cobro_nombre", header: "Contacto Cobro - Nombre", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => capitalize(m.cobroContactoNombre || "") },
  { key: "m_cobro_cel", header: "Contacto Cobro - Celular", group: "Matrícula", defaultSelected: false,
    resolver: (_p, m) => m.cobroContactoCelular || "" },

  // Curso
  { key: "c_nivel", header: "Nivel de Formación", group: "Curso", defaultSelected: true,
    resolver: (_p, _m, c, resolveNivel) => resolveNivel(c.nivelFormacionId || c.tipoFormacion) },
  { key: "c_tipo", header: "Tipo Formación", group: "Curso", defaultSelected: false,
    resolver: (_p, _m, c) => capitalize(c.tipoFormacion) },
  { key: "c_numero", header: "Número Curso", group: "Curso", defaultSelected: false,
    resolver: (_p, _m, c) => c.numeroCurso || "" },
  { key: "c_horas", header: "Duración Horas", group: "Curso", defaultSelected: true,
    resolver: (_p, _m, c) => String(c.horasTotales ?? 0) },
  { key: "c_dias", header: "Duración Días", group: "Curso", defaultSelected: false,
    resolver: (_p, _m, c) => String(c.duracionDias ?? 0) },
  { key: "c_fecha_inicio", header: "Fecha Inicio Curso", group: "Curso", defaultSelected: false,
    resolver: (_p, _m, c) => formatDate(c.fechaInicio) },
  { key: "c_fecha_fin", header: "Fecha Fin Curso", group: "Curso", defaultSelected: false,
    resolver: (_p, _m, c) => formatDate(c.fechaFin) },
  { key: "c_entrenador", header: "Entrenador", group: "Curso", defaultSelected: false,
    resolver: (_p, _m, c) => c.entrenadorNombre || "" },
  { key: "c_supervisor", header: "Supervisor", group: "Curso", defaultSelected: false,
    resolver: (_p, _m, c) => c.supervisorNombre || "" },
  { key: "c_lugar", header: "Lugar", group: "Curso", defaultSelected: false,
    resolver: (_p, _m, c) => (c as any).lugar || "" },
];

const GROUPS = ["Persona", "Matrícula", "Curso"];

export function ExportarListadoDialog({ open, onOpenChange, curso, matriculas, personas }: ExportarListadoDialogProps) {
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const resolveNivel = useResolveNivel();

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(COLUMN_CATALOG.filter((c) => c.defaultSelected).map((c) => c.key))
  );

  const personaMap = useMemo(() => new Map(personas.map((p) => [p.id, p])), [personas]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(COLUMN_CATALOG.map((c) => c.key)));
  const deselectAll = () => setSelected(new Set());

  const handleExport = () => {
    if (selected.size === 0) {
      toast({ title: "Selecciona al menos una columna", variant: "destructive" });
      return;
    }
    if (matriculas.length === 0) {
      toast({ title: "Sin estudiantes", description: "No hay matrículas para exportar.", variant: "destructive" });
      return;
    }

    const cols = COLUMN_CATALOG.filter((c) => selected.has(c.key));
    const header = cols.map((c) => c.header).join(";");
    const rows = matriculas
      .map((m) => {
        const persona = personaMap.get(m.personaId);
        if (!persona) return null;
        return cols.map((c) => c.resolver(persona, m, curso, resolveNivel)).join(";");
      })
      .filter(Boolean);

    const content = [header, ...rows].join("\n");
    const filename = `Curso_${curso.numeroCurso}_Listado.csv`;
    downloadCsv(content, filename);
    toast({ title: "Listado exportado", description: `${matriculas.length} registro(s) con ${cols.length} columnas.` });
    logActivity({ action: "exportar", module: "cursos", description: `Exportó listado del curso ${curso.numeroCurso || curso.nombre} (${matriculas.length} registros, ${cols.length} columnas)`, entityType: "curso", entityId: curso.id, metadata: { registros: matriculas.length, columnas: cols.map(c => c.key) } });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Exportar Listado de Estudiantes</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-2">
          <Button variant="outline" size="sm" onClick={selectAll}>Seleccionar todas</Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>Deseleccionar todas</Button>
          <span className="ml-auto text-xs text-muted-foreground">{selected.size} columnas</span>
        </div>

        <ScrollArea className="h-[360px] pr-2">
          {GROUPS.map((group) => {
            const cols = COLUMN_CATALOG.filter((c) => c.group === group);
            return (
              <div key={group} className="mb-4">
                <p className="text-sm font-semibold text-muted-foreground mb-1.5">{group}</p>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                  {cols.map((col) => (
                    <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selected.has(col.key)}
                        onCheckedChange={() => toggle(col.key)}
                      />
                      {col.header}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleExport} disabled={selected.size === 0}>
            <Download className="h-4 w-4 mr-1" />
            Exportar CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
