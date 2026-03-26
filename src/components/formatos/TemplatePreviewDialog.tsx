import { useRef, useCallback, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, AlertTriangle } from 'lucide-react';
import { renderTemplate, detectUnresolvedTokens, buildFormatoContext } from '@/utils/renderTemplate';
import type { FormatoFormacion } from '@/types/formatoFormacion';
import { useMatriculas } from '@/hooks/useMatriculas';
import { usePersonas } from '@/hooks/usePersonas';
import { useCursos } from '@/hooks/useCursos';

const PRINT_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; padding: 10mm; font-size: 13px; line-height: 1.6; }
  .doc-root { max-width: 210mm; margin: 0 auto; }
  h1, h2, h3 { margin-bottom: 12px; }
  p { margin-bottom: 8px; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th, td { border: 1px solid #d4d4d4; padding: 6px 10px; font-size: 12px; }
  th { background: #f5f5f5; font-weight: 600; }
  ol, ul { padding-left: 24px; margin: 8px 0; }
  li { margin-bottom: 4px; }
  @media print { body { padding: 5mm; } }
`;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formato: Partial<FormatoFormacion>;
}

export default function TemplatePreviewDialog({ open, onOpenChange, formato }: Props) {
  const documentRef = useRef<HTMLDivElement>(null);
  const [selectedMatricula, setSelectedMatricula] = useState<string>('');

  const { data: matriculas = [] } = useMatriculas();
  const { data: personas = [] } = usePersonas();
  const { data: cursos = [] } = useCursos();

  // Build context from selected matricula
  const matricula = matriculas.find(m => m.id === selectedMatricula) || null;
  const persona = matricula ? personas.find(p => p.id === matricula.personaId) || null : null;
  const curso = matricula ? cursos.find(c => c.id === matricula.cursoId) || null : null;

  const context = buildFormatoContext(persona, matricula, curso, null, null);
  const htmlTemplate = formato.htmlTemplate || '<p>Sin contenido de plantilla</p>';
  const renderedHtml = renderTemplate(htmlTemplate, context);
  const unresolvedTokens = detectUnresolvedTokens(renderedHtml);

  const handlePrint = useCallback(() => {
    if (!documentRef.current) return;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    const clone = documentRef.current.cloneNode(true) as HTMLElement;
    const filename = `${formato.nombre || 'formato'}-preview.pdf`
      .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.-]/g, '-').replace(/-{2,}/g, '-');

    printWindow.document.write(
      `<!DOCTYPE html><html><head><title>${filename}</title><style>${PRINT_STYLES}</style></head><body><div class="doc-root">${clone.innerHTML}</div></body></html>`
    );
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  }, [formato.nombre]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Vista Previa — {formato.nombre || 'Sin nombre'}</DialogTitle>
            <div className="flex items-center gap-3">
              <Select value={selectedMatricula} onValueChange={setSelectedMatricula}>
                <SelectTrigger className="w-64 h-8 text-xs">
                  <SelectValue placeholder="Seleccionar contexto (matrícula)..." />
                </SelectTrigger>
                <SelectContent>
                  {matriculas.slice(0, 20).map(m => {
                    const p = personas.find(pp => pp.id === m.personaId);
                    return (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        {p ? `${p.nombres} ${p.apellidos}` : m.id}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handlePrint}>
                <Download className="h-4 w-4 mr-1" />
                Descargar PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        {unresolvedTokens.length > 0 && (
          <Alert variant="destructive" className="mx-6 mt-3 py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>{unresolvedTokens.length}</strong> token(s) sin resolver:{' '}
              {unresolvedTokens.map(t => (
                <Badge key={t} variant="outline" className="text-[10px] mx-0.5">{`{{${t}}}`}</Badge>
              ))}
              {!selectedMatricula && ' — Selecciona una matrícula para ver datos reales.'}
            </AlertDescription>
          </Alert>
        )}

        <ScrollArea className="flex-1">
          <div className="p-4 bg-muted/30 min-h-full flex justify-center">
            <div
              ref={documentRef}
              className="shadow-lg rounded border bg-white w-full prose prose-sm max-w-none"
              style={{ maxWidth: '210mm', padding: '24px' }}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
