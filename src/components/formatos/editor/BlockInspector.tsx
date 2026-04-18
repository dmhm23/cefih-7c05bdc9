import { useFormatoEditorStore } from '@/modules/formatos/core/editor/useEditorStore';
import { BLOQUE_TYPE_LABELS, BLOQUE_ICONS } from '@/modules/formatos/plugins/safa';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, Trash2, Copy } from 'lucide-react';
import InspectorFields from './InspectorFields';
import EncabezadoConfigCard from '@/components/formatos/EncabezadoConfigCard';

interface BlockInspectorProps {
  onOpenConfig: () => void;
}

export default function BlockInspector({ onOpenConfig }: BlockInspectorProps) {
  const { selectedId, getSelectedBlock, updateBlock, removeBlock, duplicateBlock, config, setConfig } = useFormatoEditorStore();

  const block = getSelectedBlock();

  return (
    <div className="w-full min-w-0 bg-background border-l overflow-hidden flex flex-col h-full overflow-x-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {block ? 'Propiedades' : 'Inspector'}
        </span>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onOpenConfig}>
          <Settings className="h-3.5 w-3.5" />
          Ajustes del formato
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0 [&>[data-radix-scroll-area-viewport]>div]:!block [&>[data-radix-scroll-area-viewport]>div]:min-w-0 [&_[data-radix-scroll-area-viewport]]:max-w-full">
        <div className="p-4 space-y-4 break-words whitespace-normal overflow-x-hidden min-w-0 max-w-full">
          {block ? (
            <>
              {/* Block header */}
              <div className="flex items-center gap-2">
                {BLOQUE_ICONS[block.type] && (() => {
                  const Icon = BLOQUE_ICONS[block.type];
                  return <Icon className="h-4 w-4 text-muted-foreground" />;
                })()}
                <span className="text-sm font-semibold flex-1">
                  {BLOQUE_TYPE_LABELS[block.type] || block.type}
                </span>
                <Button
                  variant="outline" size="icon" className="h-7 w-7"
                  onClick={() => duplicateBlock(block.id)}
                  title="Duplicar"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline" size="icon"
                  className="h-7 w-7 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => removeBlock(block.id)}
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <Separator />

              {/* Fields */}
              <InspectorFields
                bloque={block}
                onChange={(updates) => updateBlock(block.id, updates)}
              />
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground text-center py-4">
                Selecciona un bloque para ver sus propiedades.
              </p>

              <Separator />

              {/* Encabezado config when nothing selected */}
              <EncabezadoConfigCard
                config={config.encabezadoConfig}
                onChange={(c) => setConfig({ encabezadoConfig: c })}
                enabled={config.usaEncabezadoInstitucional}
                onEnabledChange={(v) => setConfig({ usaEncabezadoInstitucional: v })}
              />
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
