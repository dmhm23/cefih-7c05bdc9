import { useState, useMemo, useCallback, useEffect } from "react";
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Plus, Trash2, Users, Award, Download, Filter, Hash, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
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
import { fmtDateLocal } from "@/utils/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import {
  evaluarElegibilidad,
  construirDiccionarioTokens,
  reemplazarTokens,
} from "@/utils/certificadoGenerator";
import type { ElegibilidadContext } from "@/utils/certificadoGenerator";
import { descargarCertificadoPdf } from "@/utils/certificadoPdf";
import { plantillaService } from "@/services/plantillaService";
import type { CertificadoGenerado } from "@/types/certificado";
import { useCodigosCurso } from "@/hooks/useCodigosCurso";
import { useResolveNivel } from "@/hooks/useResolveNivel";
import { COLUMN_CATALOG, buildCursoListadoCsv } from "@/utils/exportCursoListado";
import { downloadCsv } from "@/utils/csvMinTrabajo";
import { useQuery } from "@tanstack/react-query";

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
  const { logActivity } = useActivityLogger();
  const removerEstudiante = useRemoverEstudianteCurso();
  const generarCertificado = useGenerarCertificado();
  const { data: certificados } = useCertificadosByCurso(curso.id);

  const { codigos: codigosMapa } = useCodigosCurso(curso);
  const resolveNivel = useResolveNivel();

  const personaMap = useMemo(() => new Map(personas.map((p) => [p.id, p])), [personas]);

  const handleDescargarCsvEstudiante = useCallback((m: Matricula) => {
    const persona = personaMap.get(m.personaId);
    if (!persona) {
      toast({ title: "Persona no encontrada", variant: "destructive" });
      return;
    }
    // Exporta TODAS las columnas del catálogo para entregar la información completa.
    const { content } = buildCursoListadoCsv({
      matriculas: [m],
      personaMap,
      curso,
      resolveNivel,
      codigosEstudiante: codigosMapa,
      columnasSeleccionadas: COLUMN_CATALOG,
    });
    const cedula = (persona.numeroDocumento || "sin-doc").replace(/[^a-zA-Z0-9]/g, "");
    const nombre = `${persona.apellidos || ""}${persona.nombres || ""}`.replace(/[^a-zA-Z0-9]/g, "");
    const filename = `Curso_${curso.numeroCurso || curso.id}_${cedula}_${nombre}.csv`;
    downloadCsv(content, filename);
    toast({ title: "CSV del estudiante descargado", description: `${persona.nombres} ${persona.apellidos}` });
    logActivity({
      action: "exportar",
      module: "cursos",
      description: `Exportó CSV individual de ${persona.nombres} ${persona.apellidos} (curso ${curso.numeroCurso || curso.nombre})`,
      entityType: "matricula",
      entityId: m.id,
      metadata: { curso_id: curso.id, persona_id: persona.id },
    });
  }, [personaMap, curso, resolveNivel, codigosMapa, toast, logActivity]);

  // --- Fetch formatos requeridos para el nivel del curso ---
  const { data: formatosRequeridos = [] } = useQuery({
    queryKey: ['formatos-requeridos-curso', curso.id, curso.nivelFormacionId, curso.tipoFormacion],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formatos_formacion')
        .select('id, nombre')
        .eq('activo', true)
        .eq('visible_en_matricula', true)
        .is('deleted_at', null);
      if (error || !data) return [];
      // Filter by nivel if available
      return data.filter(f => {
        const niveles = (f as any).niveles_asignados as string[] | null;
        if (curso.nivelFormacionId && niveles && niveles.length > 0) {
          return niveles.includes(curso.nivelFormacionId);
        }
        return true; // fallback: include all active
      });
    },
  });

  // --- Fetch formato_respuestas completadas por matrícula ---
  const matriculaIds = matriculas.map(m => m.id);
  const { data: formatoRespuestas = [] } = useQuery({
    queryKey: ['formato-respuestas-curso', curso.id, matriculaIds.join(',')],
    queryFn: async () => {
      if (matriculaIds.length === 0) return [];
      const { data, error } = await supabase
        .from('formato_respuestas')
        .select('matricula_id, formato_id, estado')
        .in('matricula_id', matriculaIds)
        .eq('estado', 'completado');
      return data ?? [];
    },
    enabled: matriculaIds.length > 0,
  });

  // --- Fetch documentos_portal completados por matrícula ---
  const { data: portalDocs = [] } = useQuery({
    queryKey: ['portal-docs-curso', curso.id, matriculaIds.join(',')],
    queryFn: async () => {
      if (matriculaIds.length === 0) return [];
      const { data } = await supabase
        .from('documentos_portal')
        .select('matricula_id, documento_key, estado')
        .in('matricula_id', matriculaIds)
        .eq('estado', 'completado');
      return data ?? [];
    },
    enabled: matriculaIds.length > 0,
  });

  // Map: matriculaId -> Set of completed formato IDs
  const formatosCompletadosPorMatricula = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const r of formatoRespuestas) {
      if (!map[r.matricula_id]) map[r.matricula_id] = new Set();
      map[r.matricula_id].add(r.formato_id);
    }
    return map;
  }, [formatoRespuestas]);

  // Map: matriculaId -> Set of completed portal document keys
  const portalDocsCompletadosPorMatricula = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const r of portalDocs) {
      if (!map[r.matricula_id]) map[r.matricula_id] = new Set();
      map[r.matricula_id].add(r.documento_key);
    }
    return map;
  }, [portalDocs]);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string | string[]>>({
    documental: "todos",
    cartera: "todos",
  });
  const [modalAgregarOpen, setModalAgregarOpen] = useState(false);
  const [estudianteAEliminar, setEstudianteAEliminar] = useState<{ id: string; nombre: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [masivaDlg, setMasivaDlg] = useState(false);
  const [masivaGenerating, setMasivaGenerating] = useState(false);
  const [masivaProgreso, setMasivaProgreso] = useState(0);
  const [masivaTotal, setMasivaTotal] = useState(0);
  const [masivaResultados, setMasivaResultados] = useState<{
    generados: number;
    bloqueados: { nombre: string; motivos: string[] }[];
  } | null>(null);

  // Cartera confirmation states
  const [carteraConfirmIndividual, setCarteraConfirmIndividual] = useState<Matricula | null>(null);
  const [masivaAdvertenciasCartera, setMasivaAdvertenciasCartera] = useState<
    { nombre: string; carteraStatus: EstadoGrupoCartera }[]
  >([]);
  const [masivaPendingExecution, setMasivaPendingExecution] = useState(false);

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

  const getElegibilidadContext = (m: Matricula): ElegibilidadContext => ({
    carteraStatus: getCarteraStatus(m),
    formatosRequeridos: formatosRequeridos as any,
    formatosCompletadosIds: Array.from(formatosCompletadosPorMatricula[m.id] ?? []),
    portalDocsCompletados: Array.from(portalDocsCompletadosPorMatricula[m.id] ?? []),
  });

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

  type CertStatusResult = {
    estado: "generado" | "elegible" | "bloqueado" | "revocado" | "advertencia_cartera";
    motivos?: string[];
    motivosCartera?: string[];
    cert?: CertificadoGenerado;
  };

  const getCertStatus = (m: Matricula): CertStatusResult => {
    const cert = certMap[m.id];
    if (cert) {
      if (cert.estado === "revocado") return { estado: "revocado", cert };
      return { estado: "generado", cert };
    }
    const ctx = getElegibilidadContext(m);
    const { elegible, advertenciaCartera, motivos, motivosCartera } = evaluarElegibilidad(m, undefined, ctx);
    if (!elegible) return { estado: "bloqueado", motivos };
    if (advertenciaCartera) return { estado: "advertencia_cartera", motivosCartera };
    return { estado: "elegible" };
  };

  // --- Individual generation with cartera confirmation ---
  const executeGenerarIndividual = useCallback(async (m: Matricula) => {
    const persona = getPersona(m.personaId);
    if (!persona) return;
    try {
      const plantilla = await plantillaService.getActiva();
      if (!plantilla) {
        toast({ title: "No hay plantilla activa", variant: "destructive" });
        return;
      }
      const codigoEst = codigosMapa[m.id] ?? null;
      const dict = construirDiccionarioTokens(persona, curso, m, codigoEst || undefined);
      const codigo = codigoEst || `${curso.numeroCurso}-${String(1).padStart(3, '0')}-${new Date().getFullYear()}`;
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
      const certPersona = personas.find(p => p.id === m.personaId);
      logActivity({ action: "crear", module: "certificacion", description: `Generó certificado para ${certPersona ? certPersona.nombres + ' ' + certPersona.apellidos : m.personaId} en curso ${curso.numeroCurso || curso.nombre}`, entityType: "certificado", entityId: m.id, metadata: { curso_id: curso.id, persona_id: m.personaId } });
    } catch {
      toast({ title: "Error al generar certificado", variant: "destructive" });
    }
  }, [curso, personas, generarCertificado, toast, codigosMapa]);

  const handleGenerarIndividual = useCallback((m: Matricula) => {
    const certStatus = getCertStatus(m);
    if (certStatus.estado === "advertencia_cartera") {
      setCarteraConfirmIndividual(m);
    } else {
      executeGenerarIndividual(m);
    }
  }, [executeGenerarIndividual, certMap, grupos, formatosRequeridos, formatosCompletadosPorMatricula]);

  const handleDescargar = (cert: CertificadoGenerado) => {
    descargarCertificadoPdf(cert.svgFinal, cert.codigo);
  };

  // --- Mass generation with cartera pre-confirmation ---
  const executeMasiva = useCallback(async () => {
    const selMatriculas = matriculas.filter((m) => selectedIds.has(m.id));
    setMasivaTotal(selMatriculas.length);
    setMasivaProgreso(0);
    setMasivaResultados(null);
    setMasivaGenerating(true);
    setMasivaAdvertenciasCartera([]);

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

      const ctx = getElegibilidadContext(m);
      const { elegible, motivos } = evaluarElegibilidad(m, undefined, ctx);
      if (!elegible) {
        bloqueados.push({ nombre, motivos });
        setMasivaProgreso(i + 1);
        continue;
      }

      try {
        const codigoEst = codigosMapa[m.id] ?? null;
        const dict = construirDiccionarioTokens(persona!, curso, m, codigoEst || undefined);
        const codigo = codigoEst || `${curso.numeroCurso}-${String(generados + 1).padStart(3, '0')}-${new Date().getFullYear()}`;
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
  }, [matriculas, selectedIds, certMap, curso, personas, generarCertificado, codigosMapa, grupos, formatosRequeridos, formatosCompletadosPorMatricula]);

  const handleGeneracionMasiva = useCallback(() => {
    const selMatriculas = matriculas.filter((m) => selectedIds.has(m.id));
    
    // Check for cartera warnings among selected
    const advertencias: { nombre: string; carteraStatus: EstadoGrupoCartera }[] = [];
    for (const m of selMatriculas) {
      const cartera = getCarteraStatus(m);
      if (cartera !== 'pagado') {
        const persona = getPersona(m.personaId);
        advertencias.push({
          nombre: persona ? `${persona.nombres} ${persona.apellidos}` : m.id,
          carteraStatus: cartera,
        });
      }
    }

    if (advertencias.length > 0) {
      // Show pre-confirmation
      setMasivaAdvertenciasCartera(advertencias);
      setMasivaResultados(null);
      setMasivaDlg(true);
      setMasivaPendingExecution(true);
    } else {
      // No warnings, proceed directly
      setMasivaDlg(true);
      executeMasiva();
    }
  }, [matriculas, selectedIds, grupos, personas, executeMasiva]);

  const handleConfirmCarteraMasiva = useCallback(() => {
    setMasivaAdvertenciasCartera([]);
    setMasivaPendingExecution(false);
    executeMasiva();
  }, [executeMasiva]);

  const handleCancelCarteraMasiva = useCallback(() => {
    setMasivaAdvertenciasCartera([]);
    setMasivaPendingExecution(false);
    setMasivaDlg(false);
  }, []);

  const certBadge = (estado: string, motivos?: string[]) => {
    switch (estado) {
      case "generado":
        return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 text-xs cursor-default hover:bg-emerald-500/15">Generado</Badge>;
      case "elegible":
        return <Badge className="bg-blue-500/15 text-blue-700 border-blue-200 text-xs cursor-default hover:bg-blue-500/15">Listo para certificar</Badge>;
      case "advertencia_cartera":
        return <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 text-xs cursor-default hover:bg-amber-500/15">Pendiente de cartera</Badge>;
      case "revocado":
        return <Badge variant="destructive" className="text-xs cursor-default">Revocado</Badge>;
      case "bloqueado":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 text-xs cursor-help hover:bg-amber-500/15">Bloqueado</Badge>
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
                  {filtered.map((m) => {
                    const persona = getPersona(m.personaId);
                    const docStatus = getDocStatus(m);
                    const carteraStatus = getCarteraStatus(m);
                    const certInfo = getCertStatus(m);
                    const codigoEstudiante = codigosMapa[m.id] ?? null;
                    const canGenerate = certInfo.estado === "elegible" || certInfo.estado === "advertencia_cartera";
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
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {m.empresaNombre || "Independiente"}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {getArlDate(m) !== "—" ? fmtDateLocal(getArlDate(m)) : "—"}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {getExamDate(m) !== "—" ? fmtDateLocal(getExamDate(m)) : "—"}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge
                            variant={docStatus === "completo" ? "default" : "secondary"}
                            className={docStatus === "completo"
                              ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 text-xs cursor-default"
                              : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/10 text-xs cursor-default"}
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
                            {canGenerate && !readOnly && (
                              <IconButton
                                tooltip="Generar certificado"
                                className="h-6 w-6"
                                onClick={() => handleGenerarIndividual(m)}
                              >
                                <Award className="h-3.5 w-3.5" />
                              </IconButton>
                            )}
                            {certInfo.estado === "generado" && certInfo.cert && (
                              <IconButton
                                tooltip="Descargar PDF"
                                className="h-6 w-6"
                                onClick={() => handleDescargar(certInfo.cert!)}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </IconButton>
                            )}
                          </div>
                        </td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <IconButton
                              tooltip="Descargar CSV del estudiante"
                              className="h-7 w-7"
                              onClick={() => handleDescargarCsvEstudiante(m)}
                            >
                              <FileDown className="h-3.5 w-3.5" />
                            </IconButton>
                            <IconButton
                              tooltip="Ver matrícula"
                              className="h-7 w-7"
                              onClick={() => navigate(`/matriculas/${m.id}`, { state: { from: `/cursos/${curso.id}`, fromLabel: "Curso" } })}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </IconButton>
                            {!readOnly && (
                              <IconButton
                                tooltip="Remover estudiante"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  setEstudianteAEliminar({
                                    id: m.id,
                                    nombre: persona ? `${persona.nombres} ${persona.apellidos}` : m.id,
                                  });
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </IconButton>
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
        nivelFormacion={curso.nivelFormacionId || curso.tipoFormacion}
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

      {/* Individual cartera confirmation */}
      <ConfirmDialog
        open={!!carteraConfirmIndividual}
        onOpenChange={(open) => !open && setCarteraConfirmIndividual(null)}
        title="Cartera pendiente"
        description="Este estudiante tiene la cartera pendiente o sin facturar. ¿Desea generar el certificado de todas formas?"
        confirmText="Sí, generar certificado"
        onConfirm={async () => {
          if (carteraConfirmIndividual) {
            await executeGenerarIndividual(carteraConfirmIndividual);
          }
          setCarteraConfirmIndividual(null);
        }}
      />

      <GeneracionMasivaDialog
        open={masivaDlg}
        onOpenChange={setMasivaDlg}
        resultados={masivaResultados}
        isGenerating={masivaGenerating}
        total={masivaTotal}
        progreso={masivaProgreso}
        advertenciasCartera={masivaAdvertenciasCartera.length > 0 ? masivaAdvertenciasCartera : undefined}
        onConfirmCartera={handleConfirmCarteraMasiva}
        onCancelCartera={handleCancelCarteraMasiva}
      />

      <ConfirmDialog
        open={bulkDeleteConfirm}
        onOpenChange={setBulkDeleteConfirm}
        title="Eliminar estudiantes seleccionados"
        description={`¿Está seguro de remover ${selectedIds.size} estudiante${selectedIds.size !== 1 ? "s" : ""} de este curso? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={async () => {
          const ids = Array.from(selectedIds);
          let removed = 0;
          for (const id of ids) {
            try {
              await removerEstudiante.mutateAsync({ cursoId: curso.id, matriculaId: id });
              removed++;
            } catch { /* skip */ }
          }
          toast({ title: `${removed} estudiante${removed !== 1 ? "s" : ""} removido${removed !== 1 ? "s" : ""}` });
          setSelectedIds(new Set());
          setBulkDeleteConfirm(false);
        }}
      />

      {!readOnly && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          totalCount={filtered.length}
          selectedIds={Array.from(selectedIds)}
          onSelectAll={toggleAll}
          onClearSelection={() => setSelectedIds(new Set())}
          actions={[
            {
              label: "Generar certificados",
              icon: Award,
              onClick: () => handleGeneracionMasiva(),
            },
            {
              label: "Eliminar seleccionados",
              icon: Trash2,
              variant: "destructive" as const,
              onClick: () => setBulkDeleteConfirm(true),
            },
          ]}
        />
      )}
    </>
  );
}
