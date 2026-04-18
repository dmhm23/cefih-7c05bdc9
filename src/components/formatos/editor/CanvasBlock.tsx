import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormatoEditorStore } from '@/modules/formatos/core/editor/useEditorStore';
import BlockPreview from './BlockPreview';
import type { Bloque } from '@/modules/formatos/plugins/safa';

interface CanvasBlockProps {
  block: Bloque;
}

export default function CanvasBlock({ block }: CanvasBlockProps) {
  const { selectedId, setSelected, removeBlock, duplicateBlock } = useFormatoEditorStore();
  const isSelected = selectedId === block.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'group relative rounded-lg px-3 py-2.5 my-0.5 border transition-colors duration-150 cursor-pointer overflow-visible',
        isDragging && 'opacity-40',
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
          : 'border-transparent hover:border-border hover:bg-muted/50'
      )}
      onClick={(e) => { e.stopPropagation(); setSelected(block.id); }}
    >
      {/* Grip handle */}
      <span
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 text-muted-foreground/40 cursor-grab hover:text-muted-foreground p-0.5"
      >
        <GripVertical size={14} />
      </span>

      {/* Content */}
      <div className="pl-5 pr-14 min-w-0 overflow-visible">
        <BlockPreview block={block} />
      </div>

      {/* Actions */}
      <div className={cn(
        'absolute right-1 top-1 flex gap-0.5 z-10',
        isSelected ? 'flex' : 'hidden group-hover:flex'
      )}>
        <button
          className="p-1 rounded bg-background border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}
          title="Duplicar"
        >
          <Copy size={11} />
        </button>
        <button
          className="p-1 rounded bg-background border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
          onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
          title="Eliminar"
        >
          <X size={11} />
        </button>
      </div>
    </div>
  );
}
