import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PortalDocumentoConfigAdmin } from '@/types/portalAdmin';
import { TipoFormacion, TIPO_FORMACION_LABELS } from '@/types/curso';

const NIVELES: TipoFormacion[] = ['reentrenamiento', 'jefe_area', 'trabajador_autorizado', 'coordinador_ta'];

interface Props {
  documentos: PortalDocumentoConfigAdmin[];
  onToggle: (key: string, nivel: TipoFormacion, activo: boolean) => void;
}

export function NivelesHabilitacionGrid({ documentos, onToggle }: Props) {
  const sorted = [...documentos].sort((a, b) => a.orden - b.orden);

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">Documento</TableHead>
            {NIVELES.map(n => (
              <TableHead key={n} className="text-center min-w-[120px]">{TIPO_FORMACION_LABELS[n]}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(doc => (
            <TableRow key={doc.key}>
              <TableCell className="font-medium">{doc.nombre}</TableCell>
              {NIVELES.map(nivel => (
                <TableCell key={nivel} className="text-center">
                  <Checkbox
                    checked={doc.habilitadoPorNivel[nivel]}
                    onCheckedChange={(checked) => onToggle(doc.key, nivel, !!checked)}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
