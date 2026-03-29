import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useFormato, useUpdateFormato, useCreateFormato, useSaveVersion } from '@/hooks/useFormatosFormacion';
import { useFormatoEditorStore, type EditorItem, type FormatoConfig } from '@/stores/useFormatoEditorStore';
import type { FormatoFormacion, FormatoFormacionFormData, Bloque } from '@/types/formatoFormacion';

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
  const [showConfig, setShowConfig] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);

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

      <div className="flex flex-1 overflow-hidden">
        <BlockCatalog />
        <EditorCanvas />
        <BlockInspector onOpenConfig={() => setShowConfig(true)} />
      </div>

      <FormatoConfigSheet open={showConfig} onOpenChange={setShowConfig} />
      <FormatoPreviewDialog open={showPreview} onOpenChange={setShowPreview} formato={formatoPreview} />

      {!isNew && id && (
        <VersionHistoryDialog
          open={showVersionHistory}
          onOpenChange={setShowVersionHistory}
          formatoId={id}
        />
      )}
    </div>
  );
}
