import { useState } from 'react';
import {
  Columns2, Type, AlignLeft, Hash, Mail, Calendar, ChevronDown,
  CheckSquare, CircleDot, ListChecks, Heading, Minus, PenTool, Paperclip,
  Zap, Heart, ClipboardCheck, SmilePlus, CalendarCheck,
  Bookmark, Search, LayoutGrid,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFormatoEditorStore } from '@/modules/formatos/core/editor/useEditorStore';
import TokenLibrary from '@/components/formatos/TokenLibrary';
import type { TipoBloque } from '@/modules/formatos/plugins/safa';
import type { LucideIcon } from 'lucide-react';

interface PaletteItem {
  type: TipoBloque | 'row2' | 'row1';
  label: string;
  icon: LucideIcon;
  category: 'layout' | 'fields' | 'special';
}

const PALETTE: PaletteItem[] = [
  // Layout
  { type: 'row1', label: '1 columna', icon: LayoutGrid, category: 'layout' },
  { type: 'row2', label: '2 columnas', icon: Columns2, category: 'layout' },
  { type: 'document_header', label: 'Encabezado', icon: LayoutGrid, category: 'layout' },
  // Fields
  { type: 'section_title', label: 'Título sección', icon: Bookmark, category: 'fields' },
  { type: 'heading', label: 'Encabezado', icon: Heading, category: 'fields' },
  { type: 'paragraph', label: 'Párrafo', icon: AlignLeft, category: 'fields' },
  { type: 'text', label: 'Texto', icon: Type, category: 'fields' },
  { type: 'textarea', label: 'Texto largo', icon: AlignLeft, category: 'fields' },
  { type: 'number', label: 'Número', icon: Hash, category: 'fields' },
  { type: 'email', label: 'Email', icon: Mail, category: 'fields' },
  { type: 'date', label: 'Fecha', icon: Calendar, category: 'fields' },
  { type: 'select', label: 'Desplegable', icon: ChevronDown, category: 'fields' },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, category: 'fields' },
  { type: 'radio', label: 'Selección única', icon: CircleDot, category: 'fields' },
  { type: 'multi_choice', label: 'Selección múltiple', icon: ListChecks, category: 'fields' },
  { type: 'divider', label: 'Divisor', icon: Minus, category: 'fields' },
  { type: 'auto_field', label: 'Automático', icon: Zap, category: 'fields' },
  // Special
  { type: 'signature_capture', label: 'Captura firma', icon: PenTool, category: 'special' },
  { type: 'file', label: 'Archivo', icon: Paperclip, category: 'special' },
  { type: 'health_consent', label: 'Consentimiento salud', icon: Heart, category: 'special' },
  { type: 'evaluation_quiz', label: 'Evaluación', icon: ClipboardCheck, category: 'special' },
  { type: 'evaluation_summary', label: 'Resumen evaluación', icon: ClipboardCheck, category: 'special' },
  { type: 'satisfaction_survey', label: 'Encuesta', icon: SmilePlus, category: 'special' },
  { type: 'attendance_by_day', label: 'Asistencia diaria', icon: CalendarCheck, category: 'special' },
];

export default function BlockCatalog() {
  const { addBlock, addRow2, addRow1, getSelectedBlock, updateBlock, selectedId } = useFormatoEditorStore();
  const [search, setSearch] = useState('');
  const [showTokens, setShowTokens] = useState(false);

  const filtered = search
    ? PALETTE.filter((p) => p.label.toLowerCase().includes(search.toLowerCase()))
    : PALETTE;

  const layout = filtered.filter((p) => p.category === 'layout');
  const fields = filtered.filter((p) => p.category === 'fields');
  const special = filtered.filter((p) => p.category === 'special');

  const handleClick = (item: PaletteItem) => {
    if (item.type === 'row1') {
      addRow1();
    } else if (item.type === 'row2') {
      addRow2();
    } else {
      addBlock(item.type as TipoBloque);
    }
  };

  const handleDragStart = (e: React.DragEvent, item: PaletteItem) => {
    e.dataTransfer.setData('block-type', item.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleTokenInsert = (token: string) => {
    const block = getSelectedBlock();
    if (!block || !selectedId) return;
    let updates: Record<string, any> = {};
    if (['text', 'textarea'].includes(block.type)) {
      const current = (block as any).props?.placeholder || '';
      updates = { props: { ...(block as any).props, placeholder: current + token } };
    } else if (block.type === 'heading' || block.type === 'section_title') {
      updates = { label: (block.label || '') + ' ' + token };
    } else if (block.type === 'paragraph') {
      const current = (block as any).props?.text || '';
      updates = { props: { ...(block as any).props, text: current + ' ' + token } };
    } else {
      updates = { label: (block.label || '') + ' ' + token };
    }
    updateBlock(selectedId, updates);
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {title}
    </div>
  );

  return (
    <div className="w-full min-w-0 bg-background border-r overflow-hidden flex flex-col select-none h-full">
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar bloque..."
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="pb-4">
          <div className="flex border-b">
            <button
              className={`flex-1 py-2 text-sm font-medium transition-colors ${!showTokens ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setShowTokens(false)}
            >
              Bloques
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium transition-colors ${showTokens ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setShowTokens(true)}
            >
              Tokens
            </button>
          </div>

          {showTokens ? (
            <div className="pt-2">
              <TokenLibrary onInsertToken={handleTokenInsert} className="h-[500px]" />
            </div>
          ) : (
            <>
              {layout.length > 0 && (
                <>
                  <SectionHeader title="Diseño" />
                  <div className="px-2">
                    {layout.map((item) => (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        onClick={() => handleClick(item)}
                        className="flex items-center justify-center gap-1.5 border border-primary/20 bg-primary/5 text-primary rounded-md py-2 text-sm font-medium cursor-grab hover:bg-primary/10 hover:border-primary/30 transition-colors mb-1"
                      >
                        <item.icon size={16} /> {item.label}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {fields.length > 0 && (
                <>
                  <SectionHeader title="Campos" />
                  <div className="grid grid-cols-2 gap-1.5 px-2">
                    {fields.map((item) => (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        onClick={() => handleClick(item)}
                        className="border rounded-md py-2 px-1 cursor-grab bg-muted/30 text-center text-sm text-muted-foreground hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-colors flex flex-col items-center gap-1"
                      >
                        <item.icon size={16} />
                        {item.label}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {special.length > 0 && (
                <>
                  <SectionHeader title="Especiales" />
                  <div className="grid grid-cols-2 gap-1.5 px-2">
                    {special.map((item) => (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        onClick={() => handleClick(item)}
                        className="border rounded-md py-2 px-1 cursor-grab bg-muted/30 text-center text-sm text-muted-foreground hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-colors flex flex-col items-center gap-1"
                      >
                        <item.icon size={16} />
                        {item.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
