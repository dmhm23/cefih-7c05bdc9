import { Link } from 'react-router-dom';
import { Save, Eye, History, RotateCcw, Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useFormatoEditorStore } from '@/modules/formatos/core/editor/useEditorStore';

const CATEGORIA_LABELS: Record<string, string> = {
  formacion: 'Formación',
  evaluacion: 'Evaluación',
  asistencia: 'Asistencia',
  pta_ats: 'PTA / ATS',
  personalizado: 'Personalizado',
};

interface EditorHeaderProps {
  isNew: boolean;
  isSaving: boolean;
  savedOnce: boolean;
  onSave: () => void;
  onPreview: () => void;
  onVersionHistory?: () => void;
  onClear: () => void;
}

export default function EditorHeader({
  isNew,
  isSaving,
  savedOnce,
  onSave,
  onPreview,
  onVersionHistory,
  onClear,
}: EditorHeaderProps) {
  const { config, isDirty, items, history, future, undo, redo } = useFormatoEditorStore();
  const canUndo = history.length > 0;
  const canRedo = future.length > 0;

  return (
    <header className="sticky top-0 z-50 h-14 shrink-0 border-b bg-background px-4 flex items-center gap-3 shadow-sm">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/dashboard">SAFA</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/gestion-formatos">Formatos</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{isNew ? 'Nuevo' : 'Editar'}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 min-w-0 text-center">
        <p className="text-sm font-semibold truncate">{config.nombre || 'Sin nombre'}</p>
        <div className="flex items-center justify-center gap-1.5 mt-0.5">
          <Badge variant="secondary" className="text-[10px]">
            {CATEGORIA_LABELS[config.categoria] || config.categoria}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {isDirty && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Sin guardar</Badge>
        )}
        {!isDirty && savedOnce && (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Guardado</Badge>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost" size="sm" className="h-8 w-8 p-0"
              onClick={undo}
              disabled={!canUndo}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Deshacer (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost" size="sm" className="h-8 w-8 p-0"
              onClick={redo}
              disabled={!canRedo}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Rehacer (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>

        <Button
          variant="ghost" size="sm" className="h-8 text-xs"
          onClick={onClear}
          disabled={items.length === 0}
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Limpiar
        </Button>

        {!isNew && onVersionHistory && (
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onVersionHistory}>
            <History className="h-3.5 w-3.5 mr-1" />
            Versiones
          </Button>
        )}

        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onPreview}>
          <Eye className="h-3.5 w-3.5 mr-1" />
          Vista Previa
        </Button>

        <Button size="sm" className="h-8 text-xs" onClick={onSave} disabled={!isDirty || isSaving}>
          <Save className="h-3.5 w-3.5 mr-1" />
          Guardar
        </Button>
      </div>
    </header>
  );
}
