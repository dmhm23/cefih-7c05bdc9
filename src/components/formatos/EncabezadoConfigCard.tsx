import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { EncabezadoConfig } from '@/types/formatoFormacion';
import { useFormatoEditorStore } from '@/stores/useFormatoEditorStore';
import { LayoutGrid } from 'lucide-react';
import type { TipoBloque } from '@/types/formatoFormacion';

interface EncabezadoConfigCardProps {
  config: EncabezadoConfig;
  onChange: (config: EncabezadoConfig) => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

const DEFAULT_CONFIG: EncabezadoConfig = {
  mostrarLogo: true,
  mostrarNombreCentro: true,
  mostrarCodigoDocumento: true,
  mostrarVersion: true,
  mostrarFecha: true,
  mostrarPaginacion: false,
  alineacion: 'centro',
};

export { DEFAULT_CONFIG as DEFAULT_ENCABEZADO_CONFIG };

export default function EncabezadoConfigCard({ config, onChange, enabled, onEnabledChange }: EncabezadoConfigCardProps) {
  const { items, addBlock } = useFormatoEditorStore();

  const hasHeaderBlock = items.some((it) => it.type === 'document_header');

  const handleInsertHeader = () => {
    if (!hasHeaderBlock) {
      addBlock('document_header' as TipoBloque, 0);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Encabezado Institucional</CardTitle>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </CardHeader>
      {enabled && (
        <CardContent className="space-y-3">
          {hasHeaderBlock ? (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              El encabezado se edita directamente en el canvas. Selecciónalo para modificar textos, logo y bordes.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Inserta un bloque de encabezado en el canvas para editarlo visualmente.
              </p>
              <Button variant="outline" size="sm" className="w-full" onClick={handleInsertHeader}>
                <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                Insertar encabezado en el canvas
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
