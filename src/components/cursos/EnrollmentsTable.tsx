import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Plus, Trash2, Users, Award, Download, Filter, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterPopover, FilterConfig } from "@/components/shared/FilterPopover";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { BulkActionsBar } from "@/components/shared/BulkActionsBar";
import type { BulkAction } from "@/components/shared/BulkActionsBar";
import { AgregarEstudiantesModal } from "@/components/cursos/AgregarEstudiantesModal";
import { GeneracionMasivaDialog } from "@/components/cursos/GeneracionMasivaDialog";
import { Curso } from "@/types/curso";
import { Matricula } from "@/types/matricula";
import { useGruposCartera } from "@/hooks/useCartera";
import { EstadoGrupoCartera } from "@/types/cartera";
import { Persona } from "@/types/persona";
import { useRemoverEstudianteCurso } from "@/hooks/useCursos";
import { useCertificadosByCurso, useGenerarCertificado } from "@/hooks/useCertificados";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  evaluarElegibilidad,
  construirDiccionarioTokens,
  reemplazarTokens,
  generarCodigoCertificado,
} from "@/utils/certificadoGenerator";
import { descargarCertificadoPdf } from "@/utils/certificadoPdf";
import { plantillaService } from "@/services/plantillaService";
import type { CertificadoGenerado } from "@/types/certificado";
import { useNivelesFormacion } from "@/hooks/useNivelesFormacion";
import { generarCodigoEstudiante } from "@/utils/codigoEstudiante";
import type { ConfiguracionCodigoEstudiante } from "@/types/nivelFormacion";

interface EnrollmentsTableProps {
  curso: Curso;
  matriculas: Matricula[];
  personas: Persona[];
  readOnly?: boolean;
}

export function EnrollmentsTable({ curso, matriculas, personas, readOnly }: EnrollmentsTableProps) {
  const navigate = useNavigate();
  const { data: grupos = [] } = useGruposCartera();
  const { toast } = useToast();
  const removerEstudiante = useRemoverEstudianteCurso();
  const generarCertificado = useGenerarCertificado();
  const { data: certificados } = useCertificadosByCurso(curso.id);

  const { data: niveles } = useNivelesFormacion();
  const nivelConfig = useMemo(() => {
    if (!niveles) return null;
    const tipoToNivel: Record<string, string> = {
      reentrenamiento: 'Reentrenamiento',
      jefe_area: 'Jefe de Área',
      trabajador_autorizado: 'Trabajador Autorizado',
      coordinador_ta: 'Coordinador T.A.',
    };
    const nivelName = tipoToNivel[curso.tipoFormacion];
    return niveles.find(n => n.nombreNivel === nivelName) || null;
  }, [niveles, curso.tipoFormacion]);
  const codigoConfig = nivelConfig?.configuracionCodigoEstudiante;

  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string | string[]>>({
    documental: "todos",
    cartera: "todos",
  });
  const [modalAgregarOpen, setModalAgregarOpen] = useState(false);
  const [estudianteAEliminar, setEstudianteAEliminar] = useState<{ id: string; nombre: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [masivaDlg, setMasivaDlg] = useState(false);
  const [masivaGenerating, setMasivaGenerating] = useState(false);
  const [masivaProgreso, setMasivaProgreso] = useState(0);
  const [masivaTotal, setMasivaTotal] = useState(0);
  const [masivaResultados, setMasivaResultados] = useState<{
    generados: number;
    bloqueados: { nombre: string; motivos: string[] }[];
  } | null>(null);

  const getPersona = (personaId: string) => personas.find((p) => p.id === personaId);

  const certMap = useMemo(() => {
    if (!certificados) return {} as Record<string, CertificadoGenerado>;
    return certificados.reduce<Record<string, CertificadoGenerado>>((acc, c) => {
      acc[c.matriculaId] = c;
      return acc;
    }, {});
  }, [certificados]);

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

  const getCarteraStatus = (m: Matricula): EstadoGrupoCartera => {
    const grupo = grupos.find(g => g.matriculaIds.includes(m.id));
    return grupo?.estado ?? 'sin_facturar';
  };

  const filterConfigs: FilterConfig[] = [
    { key: "documental", label: "Estado Documental", type: "select", options: [
      { value: "pendiente", label: "Pendiente" },
      { value: "completo", label: "Completo" },
    ]},
    { key: "cartera", label: "Estado de Cartera", type: "select", options: [
      { value: "sin_facturar", label: "Sin facturar" },
      { value: "facturado", label: "Facturado" },
      { value: "abonado", label: "Abonado" },
      { value: "pagado", label: "Pagado" },
      { value: "vencido", label: "Vencido" },
    ]},
  ];

  const activeFilterCount = Object.entries(filters).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value && value !== "todos";
  }).length;

  const filtered = matriculas.filter((m) => {
    if (filters.documental !== "todos") {
      const ds = getDocStatus(m);
      if (ds !== filters.documental) return false;
    }
    if (filters.cartera !== "todos") {
      const cs = getCarteraStatus(m);
      if (cs !== filters.cartera) return false;
    }
    return true;
  });

  const allFilteredSelected = filtered.length > 0 && filtered.every((m) => selectedIds.has(m.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((m) => m.id)));
    }
  };

  const getCertStatus = (m: Matricula): { estado: "generado" | "elegible" | "bloqueado" | "revocado"; motivos?: string[]; cert?: CertificadoGenerado } => {
    const cert = certMap[m.id];
    if (cert) {
      if (cert.estado === "revocado") return { estado: "revocado", cert };
      return { estado: "generado", cert };
    }
    const { elegible, motivos } = evaluarElegibilidad(m);
    return elegible ? { estado: "elegible" } : { estado: "bloqueado", motivos };
  };

  const handleGenerarIndividual = useCallback(async (m: Matricula) => {
    const persona = getPersona(m.personaId);
    if (!persona) return;
    try {
      const plantilla = await plantillaService.getActiva();
      if (!plantilla) {
        toast({ title: "No hay plantilla activa", variant: "destructive" });
        return;
      }
      const dict = construirDiccionarioTokens(persona, curso, m);
      const codigo = generarCodigoCertificado(curso, m);
      dict.codigoCertificado = codigo;
      const svgFinal = reemplazarTokens(plantilla.svgRaw, dict);
      await generarCertificado.mutateAsync({
        matriculaId: m.id,
        cursoId: curso.id,
        personaId: m.personaId,
        plantillaId: plantilla.id,
        svgFinal,
        snapshotDatos: dict as unknown as Record<string, unknown>,
        codigo,
      });
      toast({ title: "Certificado generado" });
    } catch {
      toast({ title: "Error al generar certificado", variant: "destructive" });
    }
  }, [curso, personas, generarCertificado, toast]);

  const handleDescargar = (cert: CertificadoGenerado) => {
    descargarCertificadoPdf(cert.svgFinal, cert.codigo);
  };

  const handleGeneracionMasiva = useCallback(async () => {
    const selMatriculas = matriculas.filter((m) => selectedIds.has(m.id));
    setMasivaTotal(selMatriculas.length);
    setMasivaProgreso(0);
    setMasivaResultados(null);
    setMasivaGenerating(true);
    setMasivaDlg(true);

    let generados = 0;
    const bloqueados: { nombre: string; motivos: string[] }[] = [];

    const plantilla = await plantillaService.getActiva();
    if (!plantilla) {
      setMasivaGenerating(false);
      setMasivaResultados({ generados: 0, bloqueados: [{ nombre: "Sistema", motivos: ["No hay plantilla activa"] }] });
      return;
    }

    for (let i = 0; i < selMatriculas.length; i++) {
      const m = selMatriculas[i];
      const persona = getPersona(m.personaId);
      const nombre = persona ? `${persona.nombres} ${persona.apellidos}` : m.id;

      if (certMap[m.id]) {
        bloqueados.push({ nombre, motivos: ["Ya tiene certificado"] });
        setMasivaProgreso(i + 1);
        continue;
      }

      const { elegible, motivos } = evaluarElegibilidad(m);
      if (!elegible) {
        bloqueados.push({ nombre, motivos });
        setMasivaProgreso(i + 1);
        continue;
      }

      try {
        const dict = construirDiccionarioTokens(persona!, curso, m);
        const codigo = generarCodigoCertificado(curso, m, generados + 1);
        dict.codigoCertificado = codigo;
        const svgFinal = reemplazarTokens(plantilla.svgRaw, dict);
        await generarCertificado.mutateAsync({
          matriculaId: m.id,
          cursoId: curso.id,
          personaId: m.personaId,
          plantillaId: plantilla.id,
          svgFinal,
          snapshotDatos: dict as unknown as Record<string, unknown>,
          codigo,
        });
        generados++;
      } catch {
        bloqueados.push({ nombre, motivos: ["Error al generar"] });
      }
      setMasivaProgreso(i + 1);
    }

    setMasivaGenerating(false);
    setMasivaResultados({ generados, bloqueados });
    setSelectedIds(new Set());
  }, [matriculas, selectedIds, certMap, curso, personas, generarCertificado]);

  const certBadge = (estado: string, motivos?: string[]) => {
    switch (estado) {
      case "generado":
        return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 text-xs">Generado</Badge>;
      case "elegible":
        return <Badge className="bg-blue-500/15 text-blue-700 border-blue-200 text-xs">Elegible</Badge>;
      case "revocado":
        return <Badge variant="destructive" className="text-xs">Revocado</Badge>;
      case "bloqueado":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 text-xs cursor-help">Bloqueado</Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <ul className="text-xs space-y-0.5">
                  {motivos?.map((m, i) => <li key={i}>• {m}</li>)}
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      default:
        return null;
    }
  };

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
              <FilterPopover
                open={filterOpen}
                onOpenChange={setFilterOpen}
                filters={filterConfigs}
                values={filters}
                onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
                onClear={() => setFilters({ documental: "todos", cartera: "todos" })}
                trigger={
                  <Button variant="outline" size="sm" className="h-9 gap-2">
                    <Filter className="h-4 w-4" />
                    Filtro
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                }
              />
              {!readOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGeneracionMasiva}
                  disabled={selectedIds.size === 0 || masivaGenerating}
                >
                  <Award className="h-4 w-4 mr-1" />
                  {selectedIds.size > 0 ? `Generar (${selectedIds.size})` : "Generar certificados"}
                </Button>
              )}
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
              {(filters.documental !== "todos" || filters.cartera !== "todos") ? "No hay resultados con los filtros aplicados" : "No hay estudiantes inscritos"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    {!readOnly && (
                      <th className="py-2 pr-2 w-8">
                        <Checkbox
                          checked={allFilteredSelected}
                          onCheckedChange={toggleAll}
                        />
                      </th>
                    )}
                    <th className="text-left py-2 pr-3 font-medium">Nombre</th>
                    <th className="text-left py-2 pr-3 font-medium">Código</th>
                    <th className="text-left py-2 pr-3 font-medium">Empresa</th>
                    <th className="text-left py-2 pr-3 font-medium">Cobertura ARL</th>
                    <th className="text-left py-2 pr-3 font-medium">Examen</th>
                    <th className="text-left py-2 pr-3 font-medium">Documental</th>
                    <th className="text-left py-2 pr-3 font-medium">Cartera</th>
                    <th className="text-left py-2 pr-3 font-medium">Certificado</th>
                    <th className="text-right py-2 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, idx) => {
                    const persona = getPersona(m.personaId);
                    const docStatus = getDocStatus(m);
                    const carteraStatus = getCarteraStatus(m);
                    const certInfo = getCertStatus(m);
                    const codigoEstudiante = codigoConfig?.activo
                      ? generarCodigoEstudiante({ config: codigoConfig, curso, indexEstudiante: idx })
                      : null;
                    return (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        {!readOnly && (
                          <td className="py-2 pr-2">
                            <Checkbox
                              checked={selectedIds.has(m.id)}
                              onCheckedChange={() => toggleSelect(m.id)}
                            />
                          </td>
                        )}
                        <td className="py-2 pr-3">
                          <p className="font-medium">{persona ? `${persona.nombres} ${persona.apellidos}` : "N/A"}</p>
                        </td>
                        <td className="py-2 pr-3">
                          {codigoEstudiante ? (
                            <span className="font-mono text-xs tracking-wide">{codigoEstudiante}</span>
                          ) : !codigoConfig ? (
                            <Badge variant="secondary" className="text-[10px]">Sin regla</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Desactivado</Badge>
                          )}
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
                          <Badge
                            variant={docStatus === "completo" ? "default" : "secondary"}
                            className={docStatus === "completo"
                              ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs"
                              : "bg-amber-500/10 text-amber-600 text-xs"}
                          >
                            {docStatus === "completo" ? "Completo" : "Pendiente"}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3">
                          <StatusBadge status={carteraStatus} />
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-1.5">
                            {certBadge(certInfo.estado, certInfo.motivos)}
                            {certInfo.estado === "elegible" && !readOnly && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleGenerarIndividual(m)}
                                title="Generar certificado"
                              >
                                <Award className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {certInfo.estado === "generado" && certInfo.cert && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleDescargar(certInfo.cert!)}
                                title="Descargar PDF"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => navigate(`/matriculas/${m.id}`, { state: { from: `/cursos/${curso.id}`, fromLabel: "Curso" } })}
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
        nivelFormacion={curso.tipoFormacion}
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

      <GeneracionMasivaDialog
        open={masivaDlg}
        onOpenChange={setMasivaDlg}
        resultados={masivaResultados}
        isGenerating={masivaGenerating}
        total={masivaTotal}
        progreso={masivaProgreso}
      />
    </>
  );
}
