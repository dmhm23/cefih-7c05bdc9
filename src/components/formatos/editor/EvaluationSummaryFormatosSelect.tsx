/**
 * Selector de formato fuente para el bloque `evaluation_summary`.
 *
 * Lista solo los formatos del catálogo que contienen al menos un bloque
 * `evaluation_quiz`. Aislado en su propio archivo para que el InspectorFields
 * no tenga que importar el hook de formatos directamente.
 */
import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useFormatos } from '@/hooks/useFormatosFormacion';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function EvaluationSummaryFormatosSelect({ value, onChange }: Props) {
  const { data: formatos = [], isLoading } = useFormatos();

  const conQuiz = useMemo(
    () =>
      formatos.filter((f: any) =>
        Array.isArray(f?.bloques) && f.bloques.some((b: any) => b?.type === 'evaluation_quiz'),
      ),
    [formatos],
  );

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">Formato de evaluación enlazado</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder={isLoading ? 'Cargando...' : 'Seleccionar formato...'} />
        </SelectTrigger>
        <SelectContent>
          {conQuiz.length === 0 && !isLoading && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              No hay formatos con bloque de evaluación.
            </div>
          )}
          {conQuiz.map((f: any) => (
            <SelectItem key={f.id} value={f.id}>
              {f.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-[10px] text-muted-foreground">
        Solo se listan formatos que contienen un bloque de cuestionario de evaluación.
      </p>
    </div>
  );
}
