import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Copy } from 'lucide-react';
import { PlantillaBase } from '@/types/formatoFormacion';
import { usePlantillasBase } from '@/hooks/useFormatosFormacion';
import { Skeleton } from '@/components/ui/skeleton';

interface PlantillaBasePickerProps {
  onSelect: (plantilla: PlantillaBase) => void;
}

const CATEGORIA_LABELS: Record<string, string> = {
  formacion: 'Formación',
  evaluacion: 'Evaluación',
  asistencia: 'Asistencia',
  pta_ats: 'PTA / ATS',
  personalizado: 'Personalizado',
};

export default function PlantillaBasePicker({ onSelect }: PlantillaBasePickerProps) {
  const { data: plantillas = [], isLoading } = usePlantillasBase();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Plantillas Base</h3>
        <p className="text-xs text-muted-foreground">Selecciona una plantilla como punto de partida para tu formato</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Blank template */}
        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors group"
          onClick={() => onSelect({
            id: 'blank',
            nombre: 'En blanco',
            descripcion: 'Formato vacío',
            categoria: 'personalizado',
            htmlTemplate: '<h2 style="text-align:center;">Título del documento</h2>\n<p>Escribe el contenido aquí...</p>',
          })}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center h-40 gap-2">
            <div className="h-12 w-12 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center group-hover:border-primary/50">
              <FileText className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">En blanco</p>
            <p className="text-xs text-muted-foreground">Empezar desde cero</p>
          </CardContent>
        </Card>

        {plantillas.map(p => (
          <Card
            key={p.id}
            className="cursor-pointer hover:border-primary/50 transition-colors group"
            onClick={() => onSelect(p)}
          >
            <CardContent className="p-4 flex flex-col h-40">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Copy className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{p.nombre}</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {CATEGORIA_LABELS[p.categoria] || p.categoria}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground flex-1">{p.descripcion}</p>
              <Button variant="ghost" size="sm" className="mt-2 w-full text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                Usar esta plantilla
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
