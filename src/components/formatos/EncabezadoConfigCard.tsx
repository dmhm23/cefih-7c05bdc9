import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EncabezadoConfig } from '@/types/formatoFormacion';

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
  const update = (partial: Partial<EncabezadoConfig>) => onChange({ ...config, ...partial });

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
          <div className="space-y-2">
            {([
              ['mostrarLogo', 'Logo del centro'],
              ['mostrarNombreCentro', 'Nombre del centro'],
              ['mostrarCodigoDocumento', 'Código del documento'],
              ['mostrarVersion', 'Versión'],
              ['mostrarFecha', 'Fecha'],
              ['mostrarPaginacion', 'Paginación'],
            ] as [keyof EncabezadoConfig, string][]).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-xs">{label}</Label>
                <Switch
                  checked={!!config[key]}
                  onCheckedChange={(v) => update({ [key]: v })}
                  className="scale-75"
                />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Alineación</Label>
            <Select value={config.alineacion} onValueChange={(v) => update({ alineacion: v as EncabezadoConfig['alineacion'] })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="izquierda">Izquierda</SelectItem>
                <SelectItem value="centro">Centro</SelectItem>
                <SelectItem value="derecha">Derecha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
