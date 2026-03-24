import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PortalDocumentoConfigAdmin } from '@/types/portalAdmin';
import { TipoFormacion } from '@/types/curso';
import { mockNivelesFormacion } from '@/data/mockData';
import { resolveNivelCursoLabel } from '@/utils/resolveNivelLabel';

interface Props {
  documentos: PortalDocumentoConfigAdmin[];
  onToggle: (key: string, nivel: TipoFormacion, activo: boolean) => void;
}

export function NivelesHabilitacionGrid({ documentos, onToggle }: Props) {
  const sorted = [...documentos].sort((a, b) => a.orden - b.orden);

  const niveles = mockNivelesFormacion.map((n) => n.id) as unknown as TipoFormacion[];

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">Documento</TableHead>
            {niveles.map(n => (
              <TableHead key={n} className="text-center min-w-[120px]">{resolveNivelCursoLabel(n)}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(doc => (
            <TableRow key={doc.key}>
              <TableCell className="font-medium">{doc.nombre}</TableCell>
              {niveles.map(nivel => (
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
