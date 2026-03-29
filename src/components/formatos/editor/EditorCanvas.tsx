import { useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useFormatoEditorStore, type Row2Block } from '@/stores/useFormatoEditorStore';
import CanvasBlock from './CanvasBlock';
import CanvasRow from './CanvasRow';
import type { TipoBloque, Bloque } from '@/types/formatoFormacion';

export default function EditorCanvas() {
  const { items, docTitle, setDocTitle, setSelected, reorderBlock, addBlock, addRow2 } = useFormatoEditorStore();
  const hojaDinamicaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hojaDinamicaRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      console.log(`[hojaDinamica] altura: ${entry.contentRect.height}px | bloques: ${items.length}`);
    });
    ro.observe(hojaDinamicaRef.current);
    return () => ro.disconnect();
  }, [items.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex >= 0 && newIndex >= 0) {
      reorderBlock(oldIndex, newIndex);
    }
  }, [items, reorderBlock]);

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('block-type');
    if (!type) return;
    if (type === 'row2') {
      addRow2();
    } else {
      addBlock(type as TipoBloque);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const sortableIds = items.map((i) => i.id);

  return (
    <div
      className="h-full min-h-0 overflow-y-auto p-6 bg-muted/30 flex flex-col items-center"
      onClick={() => setSelected(null)}
      onDrop={handleCanvasDrop}
      onDragOver={handleDragOver}
    >
      <div ref={hojaDinamicaRef} id="hojaDinamica" className={`bg-background w-full max-w-4xl self-start rounded-lg shadow-md px-8 py-10 pb-20 border overflow-visible mx-auto ${items.length === 0 ? 'min-h-[600px]' : 'min-h-0 h-auto'}`}>
        {/* Document title */}
        <input
          className="text-center text-xl font-bold w-full mb-7 text-foreground bg-transparent border-none outline-none focus:ring-0"
          value={docTitle}
          onChange={(e) => setDocTitle(e.target.value)}
          placeholder="Título del documento…"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Blocks */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {items.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl bg-background text-muted-foreground">
                Arrastra bloques aquí para comenzar
              </div>
            ) : (
              items.map((item) => {
                if (item.type === 'row2') {
                  return <CanvasRow key={item.id} row={item as Row2Block} />;
                }
                return <CanvasBlock key={item.id} block={item as Bloque} />;
              })
            )}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
