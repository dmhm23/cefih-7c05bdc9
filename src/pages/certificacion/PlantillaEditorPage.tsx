import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Save, ArrowLeft } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { usePlantilla, useUpdatePlantilla, useRollbackPlantilla } from "@/hooks/usePlantillas";
import type { SvgEditableNode } from "@/types/certificado";
import SvgNodeInspector from "@/components/certificacion/SvgNodeInspector";
import PlaceholderSelector from "@/components/certificacion/PlaceholderSelector";
import PlantillaTestDialog from "@/components/certificacion/PlantillaTestDialog";
import PlantillaVersionHistory from "@/components/certificacion/PlantillaVersionHistory";

// ---- SVG Parsing helpers ----

function parseSvgNodes(svgRaw: string): SvgEditableNode[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgRaw, 'image/svg+xml');
  const nodes: SvgEditableNode[] = [];

  doc.querySelectorAll('text[id]').forEach((el) => {
    nodes.push({
      id: el.getAttribute('id')!,
      type: 'text',
      content: el.textContent || '',
      attrs: {
        fontSize: el.getAttribute('font-size') || '',
        fontWeight: el.getAttribute('font-weight') || 'normal',
        fill: el.getAttribute('fill') || '#000000',
        textAnchor: el.getAttribute('text-anchor') || 'start',
        x: el.getAttribute('x') || '0',
        y: el.getAttribute('y') || '0',
      },
      visible: true,
    });
  });

  doc.querySelectorAll('g[id]').forEach((el) => {
    nodes.push({
      id: el.getAttribute('id')!,
      type: 'group',
      attrs: {},
      visible: el.getAttribute('display') !== 'none',
    });
  });

  return nodes;
}

function applyNodesToSvg(svgRaw: string, nodes: SvgEditableNode[]): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgRaw, 'image/svg+xml');

  nodes.forEach((node) => {
    const el = doc.getElementById(node.id);
    if (!el) return;

    if (node.type === 'text') {
      el.textContent = node.content || '';
      if (node.attrs.fontSize) el.setAttribute('font-size', node.attrs.fontSize);
      if (node.attrs.fontWeight) el.setAttribute('font-weight', node.attrs.fontWeight);
      if (node.attrs.fill) el.setAttribute('fill', node.attrs.fill);
      if (node.attrs.textAnchor) el.setAttribute('text-anchor', node.attrs.textAnchor);
      if (node.attrs.x) el.setAttribute('x', node.attrs.x);
      if (node.attrs.y) el.setAttribute('y', node.attrs.y);
    }

    if (node.type === 'group') {
      if (!node.visible) el.setAttribute('display', 'none');
      else el.removeAttribute('display');
    }
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
  const [editableNodes, setEditableNodes] = useState<SvgEditableNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load plantilla
  useEffect(() => {
    if (plantilla) {
      setSvgContent(plantilla.svgRaw);
      setEditableNodes(parseSvgNodes(plantilla.svgRaw));
      setIsDirty(false);
      setSelectedNodeId(null);
    }
  }, [plantilla]);

  const selectedNode = useMemo(
    () => editableNodes.find((n) => n.id === selectedNodeId) || null,
    [editableNodes, selectedNodeId]
  );

  const renderedSvg = useMemo(() => applyNodesToSvg(svgContent, editableNodes), [svgContent, editableNodes]);

  const handleNodeChange = useCallback((updated: SvgEditableNode) => {
    setEditableNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    setIsDirty(true);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const closest = target.closest('[id]') as HTMLElement | null;
    if (closest) {
      const nodeId = closest.getAttribute('id');
      if (nodeId && editableNodes.some((n) => n.id === nodeId)) {
        setSelectedNodeId(nodeId);
        return;
      }
    }
    setSelectedNodeId(null);
  }, [editableNodes]);

  const handleInsertPlaceholder = useCallback((token: string) => {
    if (!selectedNodeId) return;
    const node = editableNodes.find((n) => n.id === selectedNodeId);
    if (!node || node.type !== 'text') return;
    handleNodeChange({ ...node, content: (node.content || '') + `{{${token}}}` });
  }, [selectedNodeId, editableNodes, handleNodeChange]);

  const handleSave = useCallback(async () => {
    if (!id) return;
    const finalSvg = applyNodesToSvg(svgContent, editableNodes);
    try {
      await updateMutation.mutateAsync({ id, data: { svgRaw: finalSvg, nombre: plantilla?.nombre || '', activa: plantilla?.activa ?? false, version: plantilla?.version || 1 } });
      toast({ title: 'Plantilla guardada', description: 'Se ha incrementado la versión.' });
      setIsDirty(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar la plantilla.', variant: 'destructive' });
    }
  }, [id, svgContent, editableNodes, updateMutation, plantilla, toast]);

  const handleRollback = useCallback(async (version: number) => {
    if (!id) return;
    try {
      await rollbackMutation.mutateAsync({ id, version });
      toast({ title: 'Versión restaurada', description: `Se restauró la versión ${version}.` });
    } catch {
      toast({ title: 'Error', description: 'No se pudo restaurar la versión.', variant: 'destructive' });
    }
  }, [id, rollbackMutation, toast]);

  // Drag for text nodes
  const dragState = useRef<{ nodeId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() !== 'text') return;
    const nodeId = target.getAttribute('id');
    if (!nodeId) return;
    const node = editableNodes.find((n) => n.id === nodeId && n.type === 'text');
    if (!node) return;
    dragState.current = { nodeId, startX: e.clientX, startY: e.clientY, origX: parseFloat(node.attrs.x) || 0, origY: parseFloat(node.attrs.y) || 0 };
    e.preventDefault();
  }, [editableNodes]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.current || !canvasRef.current) return;
    const svgEl = canvasRef.current.querySelector('svg');
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const scaleX = (svgEl.viewBox?.baseVal?.width || rect.width) / rect.width;
    const scaleY = (svgEl.viewBox?.baseVal?.height || rect.height) / rect.height;
    const dx = (e.clientX - dragState.current.startX) * scaleX;
    const dy = (e.clientY - dragState.current.startY) * scaleY;
    const newX = String(Math.round(dragState.current.origX + dx));
    const newY = String(Math.round(dragState.current.origY + dy));
    setEditableNodes((prev) =>
      prev.map((n) => n.id === dragState.current!.nodeId ? { ...n, attrs: { ...n.attrs, x: newX, y: newY } } : n)
    );
    setIsDirty(true);
    setSelectedNodeId(dragState.current.nodeId);
  }, []);

  const handleMouseUp = useCallback(() => { dragState.current = null; }, []);

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
              <BreadcrumbItem><BreadcrumbLink asChild><Link to="/certificacion/plantillas">Plantillas</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{plantilla.nombre}</BreadcrumbPage></BreadcrumbItem>
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

      {/* Editor body */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Canvas */}
        <ResizablePanel defaultSize={70} minSize={50}>
          <div
            ref={canvasRef}
            className="h-full overflow-auto bg-muted/30 flex items-start justify-center p-8"
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              className="bg-background shadow-lg rounded-lg border max-w-[900px] w-full"
              dangerouslySetInnerHTML={{ __html: renderedSvg }}
              style={{ cursor: dragState.current ? 'grabbing' : 'default' }}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel */}
        <ResizablePanel defaultSize={30} minSize={22}>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* Editable nodes list */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Elementos editables</h3>
                <div className="space-y-1">
                  {editableNodes.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setSelectedNodeId(n.id)}
                      className={`w-full text-left text-xs px-2 py-1.5 rounded-md transition-colors ${
                        n.id === selectedNodeId
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted text-foreground'
                      } ${!n.visible ? 'opacity-40 line-through' : ''}`}
                    >
                      <span className="font-mono">{n.type === 'text' ? '¶' : '▣'}</span>{' '}
                      {n.id}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Inspector */}
              {selectedNode ? (
                <SvgNodeInspector node={selectedNode} onChange={handleNodeChange} />
              ) : (
                <p className="text-xs text-muted-foreground">Selecciona un elemento del canvas o la lista para editarlo.</p>
              )}

              <Separator />

              {/* Placeholders */}
              <PlaceholderSelector
                onInsert={handleInsertPlaceholder}
                disabled={!selectedNode || selectedNode.type !== 'text'}
              />

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
