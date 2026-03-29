import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormatoEditorStore, type Row2Block } from '@/stores/useFormatoEditorStore';
import BlockPreview from './BlockPreview';
import { Badge } from '@/components/ui/badge';
import type { TipoBloque } from '@/types/formatoFormacion';

interface CanvasRowProps {
  row: Row2Block;
}

export default function CanvasRow({ row }: CanvasRowProps) {
  const { selectedId, setSelected, removeBlock, removeFromCol, insertIntoCol } = useFormatoEditorStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const anyColSelected = row.cols.some((c) => c?.id === selectedId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'group relative border rounded-lg p-2 pt-5 my-1 flex gap-2.5 transition-colors duration-150',
        isDragging && 'opacity-40',
        anyColSelected
          ? 'border-primary/60 bg-primary/5'
          : 'border-transparent hover:border-border hover:bg-muted/30'
      )}
    >
      <Badge className="absolute left-2 -top-2.5 bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5">
        2 col
      </Badge>

      <span
        {...listeners}
        className="absolute left-1 bottom-1 text-muted-foreground/40 cursor-grab hover:text-muted-foreground p-0.5"
      >
        <GripVertical size={12} />
      </span>

      <div className={cn(
        'absolute right-1.5 top-1 flex gap-1 z-10',
        anyColSelected ? 'flex' : 'hidden group-hover:flex'
      )}>
        <button
          className="p-1 rounded bg-background border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
          onClick={(e) => { e.stopPropagation(); removeBlock(row.id); }}
          title="Eliminar fila"
        >
          <X size={11} />
        </button>
      </div>

      {[0, 1].map((ci) => (
        <ColDrop
          key={ci}
          col={row.cols[ci]}
          rowId={row.id}
          colIndex={ci}
          selectedId={selectedId}
          onSelect={setSelected}
          onRemove={() => removeFromCol(row.id, ci)}
          onDrop={(type) => insertIntoCol(row.id, ci, type)}
        />
      ))}
    </div>
  );
}

function ColDrop({
  col,
  rowId,
  colIndex,
  selectedId,
  onSelect,
  onRemove,
  onDrop,
}: {
  col: Row2Block['cols'][0];
  rowId: string;
  colIndex: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRemove: () => void;
  onDrop: (type: TipoBloque) => void;
}) {
  const [over, setOver] = useState(false);
  const isSelected = col?.id === selectedId;

  return (
    <div
      className={cn(
        'flex-1 min-h-14 border-2 border-dashed rounded relative transition-all duration-150',
        over ? 'bg-primary/5 border-primary/40' : 'border-muted'
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        const type = e.dataTransfer.getData('block-type') as TipoBloque;
        if (type) onDrop(type);
      }}
    >
      {col ? (
        <div
          className={cn(
            'relative rounded px-2 py-2 pr-8 cursor-pointer border transition-colors min-w-0 overflow-hidden',
            isSelected
              ? 'border-primary/60 bg-primary/5'
              : 'border-transparent hover:border-border hover:bg-muted/50'
          )}
          onClick={(e) => { e.stopPropagation(); onSelect(col.id); }}
        >
          <BlockPreview block={col} />
          <div className={cn(
            'absolute right-1 top-1 z-10',
            isSelected ? 'block' : 'hidden group-hover:block'
          )}>
            <button
              className="p-1 rounded bg-background border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
            >
              <X size={11} />
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 text-xs pointer-events-none">
          Arrastra aquí
        </div>
      )}
    </div>
  );
}
