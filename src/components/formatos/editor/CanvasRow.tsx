import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormatoEditorStore, type Row2Block, type Row1Block } from '@/stores/useFormatoEditorStore';
import BlockPreview from './BlockPreview';
import { Badge } from '@/components/ui/badge';
import type { Bloque, TipoBloque } from '@/types/formatoFormacion';

interface CanvasRowProps {
  row: Row2Block | Row1Block;
  variant?: 'row1' | 'row2';
}

export default function CanvasRow({ row, variant }: CanvasRowProps) {
  const isRow1 = variant === 'row1' || row.type === 'row1';
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

  const cols: Bloque[][] = isRow1
    ? [(row as Row1Block).col]
    : (row as Row2Block).cols;

  const anyColSelected = cols.some((colArr) => colArr.some((c) => c.id === selectedId));

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
        {isRow1 ? '1 col' : '2 col'}
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

      {isRow1 ? (
        <ColDrop
          blocks={(row as Row1Block).col}
          rowId={row.id}
          colIndex={0}
          selectedId={selectedId}
          onSelect={setSelected}
          onRemoveBlock={(blockId) => removeFromCol(row.id, 0, blockId)}
          onDrop={(type) => insertIntoCol(row.id, 0, type)}
        />
      ) : (
        [0, 1].map((ci) => (
          <ColDrop
            key={ci}
            blocks={(row as Row2Block).cols[ci]}
            rowId={row.id}
            colIndex={ci}
            selectedId={selectedId}
            onSelect={setSelected}
            onRemoveBlock={(blockId) => removeFromCol(row.id, ci, blockId)}
            onDrop={(type) => insertIntoCol(row.id, ci, type)}
          />
        ))
      )}
    </div>
  );
}

function ColDrop({
  blocks,
  rowId,
  colIndex,
  selectedId,
  onSelect,
  onRemoveBlock,
  onDrop,
}: {
  blocks: Bloque[];
  rowId: string;
  colIndex: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRemoveBlock: (blockId: string) => void;
  onDrop: (type: TipoBloque) => void;
}) {
  const [over, setOver] = useState(false);

  return (
    <div
      className={cn(
        'flex-1 min-h-14 border-2 border-dashed rounded relative transition-all duration-150 flex flex-col',
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
      {blocks.map((block) => {
        const isSelected = block.id === selectedId;
        return (
          <div
            key={block.id}
            className={cn(
              'relative rounded px-2 py-2 pr-8 cursor-pointer border transition-colors min-w-0 overflow-visible',
              isSelected
                ? 'border-primary/60 bg-primary/5'
                : 'border-transparent hover:border-border hover:bg-muted/50'
            )}
            onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
          >
            <BlockPreview block={block} />
            <div className={cn(
              'absolute right-1 top-1 z-10',
              isSelected ? 'block' : 'hidden group-hover:block'
            )}>
              <button
                className="p-1 rounded bg-background border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                onClick={(e) => { e.stopPropagation(); onRemoveBlock(block.id); }}
              >
                <X size={11} />
              </button>
            </div>
          </div>
        );
      })}
      <div className="flex-1 min-h-6 flex items-center justify-center text-muted-foreground/40 text-xs pointer-events-none">
        {blocks.length === 0 ? 'Arrastra aquí' : '+'}
      </div>
    </div>
  );
}
