import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PortalDocumentoConfigAdmin } from '@/types/portalAdmin';
import { useNivelesFormacion } from '@/hooks/useNivelesFormacion';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  documentos: PortalDocumentoConfigAdmin[];
  onToggle: (key: string, nivelId: string, activo: boolean) => void;
}

export function NivelesHabilitacionGrid({ documentos, onToggle }: Props) {
  const sorted = [...documentos].sort((a, b) => a.orden - b.orden);
  const { data: nivelesData, isLoading } = useNivelesFormacion();

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  const niveles = nivelesData || [];

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">Documento</TableHead>
            {niveles.map(n => (
              <TableHead key={n.id} className="text-center min-w-[120px]">{n.nombreNivel}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(doc => (
            <TableRow key={doc.key}>
              <TableCell className="font-medium">{doc.nombre}</TableCell>
              {niveles.map(nivel => (
                <TableCell key={nivel.id} className="text-center">
                  <Checkbox
                    checked={doc.nivelesHabilitados.length === 0 || doc.nivelesHabilitados.includes(nivel.id)}
                    onCheckedChange={(checked) => onToggle(doc.key, nivel.id, !!checked)}
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
