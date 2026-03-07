import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const PLACEHOLDER_CATEGORIES: Record<string, { label: string; tokens: string[] }> = {
  persona: {
    label: 'Persona',
    tokens: ['nombreCompleto', 'nombres', 'apellidos', 'tipoDocumento', 'numeroDocumento'],
  },
  curso: {
    label: 'Curso',
    tokens: ['numeroCurso', 'tipoFormacion', 'fechaInicio', 'fechaFin', 'duracionDias', 'horasTotales'],
  },
  personal: {
    label: 'Personal',
    tokens: ['entrenadorNombre', 'supervisorNombre'],
  },
  empresa: {
    label: 'Empresa',
    tokens: ['empresaNombre', 'empresaNit', 'empresaCargo'],
  },
  certificado: {
    label: 'Certificado',
    tokens: ['codigoCertificado', 'fechaGeneracion'],
  },
};

interface Props {
  onInsert: (token: string) => void;
  disabled?: boolean;
}

export default function PlaceholderSelector({ onInsert, disabled }: Props) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Placeholders</h3>
      <p className="text-xs text-muted-foreground">Click para insertar en el nodo seleccionado</p>
      <Accordion type="multiple" className="w-full">
        {Object.entries(PLACEHOLDER_CATEGORIES).map(([key, cat]) => (
          <AccordionItem key={key} value={key}>
            <AccordionTrigger className="text-xs font-medium py-2">{cat.label}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-1.5">
                {cat.tokens.map((t) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className={`cursor-pointer text-xs hover:bg-primary hover:text-primary-foreground transition-colors ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => !disabled && onInsert(t)}
                  >
                    {`{{${t}}}`}
                  </Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
