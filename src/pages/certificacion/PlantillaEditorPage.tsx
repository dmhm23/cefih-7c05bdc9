import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Save, ArrowLeft, Link2, FileText } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { usePlantilla, useUpdatePlantilla, useRollbackPlantilla } from "@/hooks/usePlantillas";
import type { PlantillaTagMapping } from "@/types/certificado";
import PlantillaTestDialog from "@/components/certificacion/PlantillaTestDialog";
import PlantillaVersionHistory from "@/components/certificacion/PlantillaVersionHistory";

// ---- Token catalog ----

const TOKEN_CATEGORIES: Record<string, { label: string; tokens: string[] }> = {
  persona: {
    label: 'Persona',
    tokens: ['nombreCompleto', 'nombres', 'apellidos', 'tipoDocumento', 'numeroDocumento'],
  },
  curso: {
    label: 'Curso',
    tokens: ['numeroCurso', 'tipoFormacion', 'fechaInicio', 'fechaFin', 'duracionDias', 'horasTotales'],
  },
  personal: {
    label: 'Personal',
    tokens: ['entrenadorNombre', 'supervisorNombre'],
  },
  empresa: {
    label: 'Empresa',
    tokens: ['empresaNombre', 'empresaNit', 'empresaCargo'],
  },
  certificado: {
    label: 'Certificado',
    tokens: ['codigoCertificado', 'fechaGeneracion'],
  },
};

// ---- SVG Parsing ----

function extractTextTags(svgRaw: string): PlantillaTagMapping[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgRaw, 'image/svg+xml');
  const mappings: PlantillaTagMapping[] = [];

  doc.querySelectorAll('text[id]').forEach((el) => {
    const content = el.textContent || '';
    const tokenMatch = content.match(/^\{\{(\w+)\}\}$/);
    mappings.push({
      elementId: el.getAttribute('id')!,
      currentContent: content,
      mappedToken: tokenMatch ? tokenMatch[1] : null,
    });
  });

  return mappings;
}

function applyMappingsToSvg(svgRaw: string, mappings: PlantillaTagMapping[]): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgRaw, 'image/svg+xml');

  mappings.forEach((m) => {
    const el = doc.getElementById(m.elementId);
    if (!el) return;
    el.textContent = m.mappedToken ? `{{${m.mappedToken}}}` : m.currentContent;
  });

  return new XMLSerializer().serializeToString(doc);
}

// ---- Main Component ----

export default function PlantillaEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: plantilla, isLoading } = usePlantilla(id!);
  const updateMutation = useUpdatePlantilla();
  const rollbackMutation = useRollbackPlantilla();

  const [svgContent, setSvgContent] = useState('');
  const [mappings, setMappings] = useState<PlantillaTagMapping[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (plantilla) {
      setSvgContent(plantilla.svgRaw);
      setMappings(extractTextTags(plantilla.svgRaw));
      setIsDirty(false);
    }
  }, [plantilla]);

  const renderedSvg = useMemo(() => applyMappingsToSvg(svgContent, mappings), [svgContent, mappings]);

  const linkedCount = useMemo(() => mappings.filter(m => m.mappedToken).length, [mappings]);

  const handleTokenChange = useCallback((elementId: string, token: string) => {
    setMappings(prev => prev.map(m => {
      if (m.elementId !== elementId) return m;
      if (token === '__none__') {
        return { ...m, mappedToken: null };
      }
      return { ...m, mappedToken: token, currentContent: `{{${token}}}` };
    }));
    setIsDirty(true);
  }, []);

  const handleContentChange = useCallback((elementId: string, content: string) => {
    setMappings(prev => prev.map(m =>
      m.elementId === elementId ? { ...m, currentContent: content, mappedToken: null } : m
    ));
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!id) return;
    const finalSvg = applyMappingsToSvg(svgContent, mappings);
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          svgRaw: finalSvg,
          nombre: plantilla?.nombre || '',
          activa: plantilla?.activa ?? false,
          version: plantilla?.version || 1,
        },
      });
      toast({ title: 'Plantilla guardada', description: 'Se ha incrementado la versión.' });
      setIsDirty(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar la plantilla.', variant: 'destructive' });
    }
  }, [id, svgContent, mappings, updateMutation, plantilla, toast]);

  const handleRollback = useCallback(async (version: number) => {
    if (!id) return;
    try {
      await rollbackMutation.mutateAsync({ id, version });
      toast({ title: 'Versión restaurada', description: `Se restauró la versión ${version}.` });
    } catch {
      toast({ title: 'Error', description: 'No se pudo restaurar la versión.', variant: 'destructive' });
    }
  }, [id, rollbackMutation, toast]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Skeleton className="h-96 w-96" />
      </div>
    );
  }

  if (!plantilla) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        Plantilla no encontrada.
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/certificacion/plantillas')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/certificacion/plantillas">Plantillas</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{plantilla.nombre}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Badge variant={isDirty ? 'secondary' : 'default'} className="text-xs">
            {isDirty ? 'Sin guardar' : `v${plantilla.version}`}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <PlantillaTestDialog svgContent={renderedSvg} />
          <Button size="sm" onClick={handleSave} disabled={!isDirty || updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" /> Guardar
          </Button>
        </div>
      </header>

      {/* Body */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* SVG Preview */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <div className="h-full overflow-auto bg-muted/30 flex items-start justify-center p-8">
            <div
              className="bg-background shadow-lg rounded-lg border max-w-[900px] w-full"
              dangerouslySetInnerHTML={{ __html: renderedSvg }}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Mapping Panel */}
        <ResizablePanel defaultSize={40} minSize={28}>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* Summary */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Mapeo de etiquetas</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {mappings.length} etiquetas detectadas · {linkedCount} vinculadas
                </p>
              </div>

              {/* Mapping table */}
              {mappings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Sin etiquetas</p>
                  <p className="text-xs">El SVG no contiene elementos &lt;text&gt; con id.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">ID</TableHead>
                      <TableHead className="text-xs">Contenido</TableHead>
                      <TableHead className="text-xs">Campo vinculado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappings.map((m) => (
                      <TableRow key={m.elementId}>
                        <TableCell className="font-mono text-xs py-2">{m.elementId}</TableCell>
                        <TableCell className="py-2">
                          <Input
                            value={m.mappedToken ? `{{${m.mappedToken}}}` : m.currentContent}
                            onChange={(e) => handleContentChange(m.elementId, e.target.value)}
                            disabled={!!m.mappedToken}
                            className="h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Select
                            value={m.mappedToken || '__none__'}
                            onValueChange={(v) => handleTokenChange(m.elementId, v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Texto fijo" />
                            </SelectTrigger>
                            <SelectContent side="bottom">
                              <SelectItem value="__none__">Texto fijo</SelectItem>
                              {Object.entries(TOKEN_CATEGORIES).map(([key, cat]) => (
                                <SelectGroup key={key}>
                                  <SelectLabel className="text-xs">{cat.label}</SelectLabel>
                                  {cat.tokens.map((t) => (
                                    <SelectItem key={t} value={t} className="text-xs">
                                      {`{{${t}}}`}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <Separator />

              {/* Version history */}
              <PlantillaVersionHistory
                historial={plantilla.historial}
                currentVersion={plantilla.version}
                onRollback={handleRollback}
              />
            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
