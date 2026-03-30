import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useFormato, useUpdateFormato, useCreateFormato, useSaveVersion } from '@/hooks/useFormatosFormacion';
import { useFormatoEditorStore, type EditorItem, type FormatoConfig } from '@/stores/useFormatoEditorStore';
import type { FormatoFormacion, FormatoFormacionFormData, Bloque } from '@/types/formatoFormacion';

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import EditorHeader from '@/components/formatos/editor/EditorHeader';
import BlockCatalog from '@/components/formatos/editor/BlockCatalog';
import EditorCanvas from '@/components/formatos/editor/EditorCanvas';
import BlockInspector from '@/components/formatos/editor/BlockInspector';
import FormatoConfigSheet from '@/components/formatos/editor/FormatoConfigSheet';
import FormatoPreviewDialog from '@/components/formatos/FormatoPreviewDialog';
import VersionHistoryDialog from '@/components/formatos/VersionHistoryDialog';

export default function FormatoEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = !id || id === 'nuevo';

  const { data: existing, isLoading } = useFormato(isNew ? undefined : id);
  const updateMutation = useUpdateFormato();
  const createMutation = useCreateFormato();
  const saveVersionMutation = useSaveVersion();

  const store = useFormatoEditorStore();
  const [showPreview, setShowPreview] = useState(false);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        store.undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        store.redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store]);
  const [showConfig, setShowConfig] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);

  // Pending navigation path when user tries to leave with unsaved changes
  const [pendingNavPath, setPendingNavPath] = useState<string | null>(null);

  // Intercept sidebar / internal navigation via custom navigate wrapper
  const guardedNavigate = (to: string) => {
    if (store.isDirty) {
      setPendingNavPath(to);
    } else {
      navigate(to);
    }
  };

  // Expose guardedNavigate on window so sidebar links can use it
  useEffect(() => {
    (window as any).__formatoGuardedNavigate = guardedNavigate;
    return () => { delete (window as any).__formatoGuardedNavigate; };
  });

  // Native browser warning on tab close / reload
  useEffect(() => {
    if (!store.isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [store.isDirty]);

  // Intercept browser back/forward buttons via popstate
  useEffect(() => {
    if (!store.isDirty) return;
    const handlePop = () => {
      // Push state back to prevent leaving
      window.history.pushState(null, '', window.location.href);
      setPendingNavPath('__back__');
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [store.isDirty]);

  // Load existing formato into store
  useEffect(() => {
    if (existing) {
      const config: FormatoConfig = {
        nombre: existing.nombre,
        descripcion: existing.descripcion,
        codigo: existing.codigo,
        version: existing.version,
        categoria: existing.categoria,
        asignacionScope: existing.asignacionScope,
        tipoCursoKeys: existing.tipoCursoKeys,
        nivelFormacionIds: existing.nivelFormacionIds,
        visibleEnMatricula: existing.visibleEnMatricula,
        visibleEnCurso: existing.visibleEnCurso,
        activo: existing.activo,
        requiereFirmaAprendiz: existing.requiereFirmaAprendiz,
        requiereFirmaEntrenador: existing.requiereFirmaEntrenador,
        requiereFirmaSupervisor: existing.requiereFirmaSupervisor,
        usaEncabezadoInstitucional: existing.usaEncabezadoInstitucional,
        encabezadoConfig: existing.encabezadoConfig || {
          mostrarLogo: true, mostrarNombreCentro: true, mostrarCodigoDocumento: true,
          mostrarVersion: true, mostrarFecha: true, mostrarPaginacion: false, alineacion: 'centro',
        },
      };
      store.loadFromFormato(existing.bloques as EditorItem[], config, existing.nombre);
    }
  }, [existing]);

  // Reset on unmount
  useEffect(() => () => store.reset(), []);

  const handleSave = async () => {
    const { config, items, docTitle } = store;
    if (!config.nombre.trim()) {
      toast({ title: 'El nombre es obligatorio', variant: 'destructive' });
      return;
    }

    // Extract flat bloques from items (row2 cols become inline)
    const bloques: Bloque[] = [];
    for (const item of items) {
      if (item.type === 'row2') {
        // Store row2 blocks inline for now — the preview handles them
        // For persistence, we store the items array as-is
      } else {
        bloques.push(item as Bloque);
      }
    }

    const data: FormatoFormacionFormData = {
      nombre: config.nombre,
      descripcion: config.descripcion,
      codigo: config.codigo,
      version: config.version,
      asignacionScope: config.asignacionScope,
      nivelFormacionIds: config.nivelFormacionIds,
      tipoCursoKeys: config.tipoCursoKeys,
      visibleEnMatricula: config.visibleEnMatricula,
      visibleEnCurso: config.visibleEnCurso,
      activo: config.activo,
      esAutomatico: false,
      motorRender: 'bloques',
      categoria: config.categoria,
      estado: config.activo ? 'activo' : 'borrador',
      usaEncabezadoInstitucional: config.usaEncabezadoInstitucional,
      encabezadoConfig: config.usaEncabezadoInstitucional ? config.encabezadoConfig : undefined,
      requiereFirmaAprendiz: config.requiereFirmaAprendiz,
      requiereFirmaEntrenador: config.requiereFirmaEntrenador,
      requiereFirmaSupervisor: config.requiereFirmaSupervisor,
      bloques: items as Bloque[], // Store all items including row2
      documentMeta: existing?.documentMeta,
    };

    try {
      if (isNew) {
        await createMutation.mutateAsync(data);
        toast({ title: 'Formato creado correctamente' });
      } else {
        await updateMutation.mutateAsync({ id: id!, data });
        toast({ title: 'Formato actualizado correctamente' });
      }
      store.markClean();
      setSavedOnce(true);
      navigate('/gestion-formatos');
    } catch {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    }
  };

  const handleClear = () => {
    store.setItems([]);
    store.setSelected(null);
  };

  const isSaving = updateMutation.isPending || createMutation.isPending;

  if (!isNew && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 w-96">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const formatoPreview: Partial<FormatoFormacion> = {
    nombre: store.config.nombre,
    descripcion: store.config.descripcion,
    codigo: store.config.codigo,
    version: store.config.version,
    bloques: store.items as Bloque[],
    motorRender: 'bloques',
    categoria: store.config.categoria,
    estado: store.config.activo ? 'activo' : 'borrador',
    usaEncabezadoInstitucional: store.config.usaEncabezadoInstitucional,
    documentMeta: existing?.documentMeta,
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-muted/30">
      <EditorHeader
        isNew={isNew}
        isSaving={isSaving}
        savedOnce={savedOnce}
        onSave={handleSave}
        onPreview={() => setShowPreview(true)}
        onVersionHistory={!isNew ? () => setShowVersionHistory(true) : undefined}
        onClear={handleClear}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        <ResizablePanel defaultSize={15} minSize={12} maxSize={22}>
          <BlockCatalog />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={55} minSize={40}>
          <EditorCanvas />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <BlockInspector onOpenConfig={() => setShowConfig(true)} />
        </ResizablePanel>
      </ResizablePanelGroup>

      <FormatoConfigSheet open={showConfig} onOpenChange={setShowConfig} />
      <FormatoPreviewDialog open={showPreview} onOpenChange={setShowPreview} formato={formatoPreview} />

      {!isNew && id && (
        <VersionHistoryDialog
          open={showVersionHistory}
          onOpenChange={setShowVersionHistory}
          formatoId={id}
        />
      )}

      <ConfirmDialog
        open={pendingNavPath !== null}
        onOpenChange={(open) => { if (!open) setPendingNavPath(null); }}
        title="Cambios sin guardar"
        description="Tienes cambios sin guardar. Si sales ahora, se perderán."
        confirmText="Salir sin guardar"
        cancelText="Seguir editando"
        onConfirm={() => {
          const path = pendingNavPath;
          setPendingNavPath(null);
          store.markClean();
          if (path === '__back__') {
            window.history.back();
          } else if (path) {
            navigate(path);
          }
        }}
        variant="destructive"
      />
    </div>
  );
}
