import type { Bloque } from '@/types/formatoFormacion';
import { BLOQUE_TYPE_LABELS } from '@/data/bloqueConstants';
import { Badge } from '@/components/ui/badge';
import { getAutoFieldLabel } from '@/data/autoFieldCatalog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface BlockPreviewProps {
  block: Bloque;
}

export default function BlockPreview({ block }: BlockPreviewProps) {
  const b = block as any;
  const req = b.required && <span className="text-destructive ml-0.5">*</span>;
  const L = () => (
    <span className="block text-xs font-semibold text-muted-foreground mb-1">
      {b.label || 'Sin etiqueta'}{req}
    </span>
  );

  switch (block.type) {
    case 'text':
      return <><L /><Input disabled placeholder={b.props?.placeholder || ''} className="h-8 text-xs pointer-events-none" /></>;

    case 'textarea':
      return <><L /><Textarea disabled placeholder={b.props?.placeholder || ''} className="h-16 text-xs resize-none pointer-events-none" /></>;

    case 'email':
      return <><L /><Input disabled type="email" placeholder={b.props?.placeholder || 'correo@ejemplo.com'} className="h-8 text-xs pointer-events-none" /></>;

    case 'number':
      return <><L /><Input disabled type="number" placeholder={b.props?.placeholder || '0'} className="h-8 text-xs pointer-events-none" /></>;

    case 'date':
      return <><L /><Input disabled type="date" className="h-8 text-xs pointer-events-none" /></>;

    case 'select':
      return (
        <>
          <L />
          <div className="h-8 w-full border rounded-md bg-background px-2 flex items-center text-xs text-muted-foreground pointer-events-none">
            Selecciona…
          </div>
        </>
      );

    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 border rounded bg-background" />
          <span className="text-xs">{b.label || 'Opción'}</span>
        </div>
      );

    case 'radio': {
      const options = b.props?.options || [];
      return (
        <>
          <L />
          <div className="space-y-1">
            {options.map((o: any, i: number) => (
              <label key={i} className="flex items-center gap-1.5 text-xs">
                <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40" />
                {o.label}
              </label>
            ))}
          </div>
        </>
      );
    }

    case 'heading':
      return (
        <div className="text-sm font-semibold text-foreground my-1">
          {b.label || 'Nueva sección'}
        </div>
      );

    case 'section_title':
      return (
        <div className="border-b border-border pb-1">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {b.label || 'Título de sección'}
          </h3>
        </div>
      );

    case 'paragraph':
      return (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {b.props?.text || 'Texto del párrafo...'}
        </p>
      );

    case 'divider':
      return <hr className="border-t-2 border-muted my-1" />;

    case 'auto_field': {
      const key = b.props?.key || '';
      return (
        <div>
          <span className="block text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
            {b.label || getAutoFieldLabel(key)}
            <Badge variant="secondary" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200 h-4 px-1">Auto</Badge>
          </span>
          <div className="h-8 w-full border border-dashed rounded-md bg-blue-50/30 px-2 flex items-center text-xs text-blue-600 pointer-events-none">
            {`{{${key}}}`}
          </div>
        </div>
      );
    }

    case 'signature_aprendiz':
    case 'signature_entrenador_auto':
    case 'signature_supervisor_auto':
      return (
        <>
          <L />
          <div className="border-2 border-dashed border-muted rounded h-12 flex items-center justify-center text-muted-foreground text-xs">
            Firma aquí
          </div>
        </>
      );

    case 'file':
      return (
        <>
          <L />
          <div className="h-8 w-full border rounded-md bg-background px-2 flex items-center text-xs text-muted-foreground pointer-events-none">
            Adjuntar ({b.props?.accept || '*'})
          </div>
        </>
      );

    case 'health_consent':
    case 'data_authorization':
    case 'evaluation_quiz':
    case 'satisfaction_survey':
    case 'attendance_by_day':
      return (
        <div className="border rounded-lg p-2.5 bg-muted/20">
          <Badge variant="secondary" className="text-[10px]">
            {BLOQUE_TYPE_LABELS[block.type] || block.type}
          </Badge>
          <p className="text-xs text-muted-foreground mt-1">Componente especializado</p>
        </div>
      );

    default:
      return <p className="text-xs text-muted-foreground">Bloque: {block.type}</p>;
  }
}
