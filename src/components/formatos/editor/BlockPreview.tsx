import DOMPurify from 'dompurify';
import type { Bloque, BloqueEvaluationQuiz, BloqueSatisfactionSurvey, BloqueHealthConsent, BloqueDataAuthorization, BloqueDocumentHeader } from '@/types/formatoFormacion';
import { BLOQUE_TYPE_LABELS } from '@/data/bloqueConstants';
import { Badge } from '@/components/ui/badge';
import { getAutoFieldLabel } from '@/data/autoFieldCatalog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, AlertCircle, ImageIcon } from 'lucide-react';

interface BlockPreviewProps {
  block: Bloque;
}

export default function BlockPreview({ block }: BlockPreviewProps) {
  const b = block as any;
  const req = b.required && <span className="text-destructive ml-0.5">*</span>;
  const L = () => (
    <span className="block text-sm font-medium text-foreground mb-1">
      {b.label || 'Sin etiqueta'}{req}
    </span>
  );

  switch (block.type) {
    case 'text':
      return <><L /><Input disabled placeholder={b.props?.placeholder || ''} className="h-9 text-sm pointer-events-none" /></>;

    case 'textarea':
      return <><L /><Textarea disabled placeholder={b.props?.placeholder || ''} className="h-16 text-sm resize-none pointer-events-none" /></>;

    case 'email':
      return <><L /><Input disabled type="email" placeholder={b.props?.placeholder || 'correo@ejemplo.com'} className="h-9 text-sm pointer-events-none" /></>;

    case 'number':
      return <><L /><Input disabled type="number" placeholder={b.props?.placeholder || '0'} className="h-9 text-sm pointer-events-none" /></>;

    case 'date':
      return <><L /><Input disabled type="date" className="h-9 text-sm pointer-events-none" /></>;

    case 'select':
      return (
        <>
          <L />
          <div className="h-9 w-full border rounded-md bg-background px-2 flex items-center text-sm text-muted-foreground pointer-events-none">
            Selecciona…
          </div>
        </>
      );

    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 border rounded bg-background" />
          <span className="text-sm">{b.label || 'Opción'}</span>
        </div>
      );

    case 'radio': {
      const options = b.props?.options || [];
      return (
        <>
          <L />
          <div className="space-y-1.5">
            {options.map((o: any, i: number) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <div className={`h-4 w-4 rounded-full border ${o.default ? 'border-primary bg-primary/20' : 'border-muted-foreground/40'}`} />
                <span className={o.default ? 'font-medium' : ''}>{o.label}</span>
              </label>
            ))}
          </div>
        </>
      );
    }

    case 'multi_choice': {
      const options = b.props?.options || [];
      return (
        <>
          <L />
          <div className="space-y-1.5">
            {options.map((o: any, i: number) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <div className={`h-4 w-4 border rounded ${o.default ? 'border-primary bg-primary/20' : 'border-muted-foreground/40'}`} />
                <span className={o.default ? 'font-medium' : ''}>{o.label}</span>
              </label>
            ))}
          </div>
        </>
      );
    }

    case 'heading':
      return (
        <div className="text-base font-semibold text-foreground my-1">
          {b.label || 'Nueva sección'}
        </div>
      );

    case 'section_title':
      return (
        <div className="border-b border-border pb-1">
          <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {b.label || 'Título de sección'}
          </h3>
        </div>
      );

    case 'paragraph': {
      const rawHtml = b.props?.text || '';
      const isHtml = /<[a-z][\s\S]*>/i.test(rawHtml);
      if (isHtml) {
        return (
          <div
            className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawHtml) }}
          />
        );
      }
      return (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {rawHtml || 'Texto del párrafo...'}
        </p>
      );
    }

    case 'divider':
      return <hr className="border-t-2 border-muted my-1" />;

    case 'auto_field': {
      const key = b.props?.key || '';
      return (
        <div>
          <span className="block text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
            {b.label || getAutoFieldLabel(key)}
            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200 h-5 px-1.5">Auto</Badge>
          </span>
          <div className="h-9 w-full border border-dashed rounded-md bg-blue-50/30 px-2 flex items-center text-sm text-blue-600 pointer-events-none">
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
          <div className="border-2 border-dashed border-muted rounded h-14 flex items-center justify-center text-muted-foreground text-sm">
            Firma aquí
          </div>
        </>
      );

    case 'file':
      return (
        <>
          <L />
          <div className="h-9 w-full border rounded-md bg-background px-2 flex items-center text-sm text-muted-foreground pointer-events-none">
            Adjuntar ({b.props?.accept || '*'})
          </div>
        </>
      );

    case 'evaluation_quiz':
      return <EvaluationQuizPreview block={block as BloqueEvaluationQuiz} />;

    case 'satisfaction_survey':
      return <SatisfactionSurveyPreview block={block as BloqueSatisfactionSurvey} />;

    case 'health_consent':
      return <HealthConsentPreview block={block as BloqueHealthConsent} />;

    case 'data_authorization':
      return <DataAuthorizationPreview block={block as BloqueDataAuthorization} />;

    case 'document_header':
      return <DocumentHeaderPreview block={block as BloqueDocumentHeader} />;

    case 'attendance_by_day':
      return (
        <div className="border rounded-lg p-2.5 bg-muted/20">
          <Badge variant="secondary" className="text-xs">Asistencia por día</Badge>
          <p className="text-sm text-muted-foreground mt-1">Tabla de asistencia diaria generada automáticamente</p>
        </div>
      );

    default:
      return <p className="text-sm text-muted-foreground">Bloque: {(block as any).type}</p>;
  }
}

/* ── Evaluation Quiz Preview ── */
function EvaluationQuizPreview({ block }: { block: BloqueEvaluationQuiz }) {
  const { umbralAprobacion = 70, preguntas = [] } = block.props || {};
  return (
    <div className="space-y-2 min-w-0 max-w-full overflow-visible">
      <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
        <span className="text-sm font-semibold text-muted-foreground min-w-0 break-words">{block.label || 'Evaluación'}</span>
        <Badge variant="outline" className="text-xs h-5 px-1.5 border-amber-300 text-amber-700 bg-amber-50">
          Mín. {umbralAprobacion}%
        </Badge>
        <Badge variant="secondary" className="text-xs h-5 px-1.5">
          {preguntas.length} pregunta{preguntas.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      {preguntas.length === 0 && (
        <div className="border border-dashed rounded-md p-3 flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" /> Sin preguntas configuradas
        </div>
      )}
      {preguntas.map((p, idx) => (
        <div key={p.id} className="border rounded-md p-2.5 bg-background space-y-1.5 min-w-0 max-w-full overflow-visible">
          <p className="text-sm font-medium text-foreground leading-relaxed break-words whitespace-pre-wrap">{idx + 1}. {p.texto}</p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-3 gap-y-1.5 min-w-0 max-w-full">
            {p.opciones.map((op, oi) => (
              <label key={oi} className="flex items-start gap-1.5 text-sm text-muted-foreground min-w-0 max-w-full">
                <div className={`h-4 w-4 rounded-full border shrink-0 mt-0.5 ${oi === p.correcta ? 'border-emerald-500 bg-emerald-500/20' : 'border-muted-foreground/30'}`} />
                <span className={oi === p.correcta ? 'text-emerald-700 font-medium break-words whitespace-pre-wrap leading-relaxed min-w-0' : 'break-words whitespace-pre-wrap leading-relaxed min-w-0'}>{op}</span>
                {oi === p.correcta && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 ml-0.5" />}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Satisfaction Survey Preview ── */
function SatisfactionSurveyPreview({ block }: { block: BloqueSatisfactionSurvey }) {
  const { escalaPreguntas = [], escalaOpciones = [], preguntaSiNo } = block.props || {};
  return (
    <div className="space-y-2 min-w-0 max-w-full overflow-visible">
      <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
        <span className="text-sm font-semibold text-muted-foreground min-w-0 break-words">{block.label || 'Encuesta de satisfacción'}</span>
        <Badge variant="secondary" className="text-xs h-5 px-1.5">
          {escalaPreguntas.length} pregunta{escalaPreguntas.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      {/* Scale header */}
      {escalaOpciones.length > 0 && (
        <div className="border rounded-md overflow-visible max-w-full">
          <div className="grid bg-muted/40 text-xs font-medium text-muted-foreground min-w-0" style={{ gridTemplateColumns: `minmax(0, 1fr) repeat(${escalaOpciones.length}, minmax(48px, 60px))` }}>
            <div className="px-2 py-1.5 border-r">Pregunta</div>
            {escalaOpciones.map((o) => (
              <div key={o.value} className="text-center py-1.5 border-r last:border-r-0">{o.label}</div>
            ))}
          </div>
          {escalaPreguntas.map((q, i) => (
            <div key={i} className="grid border-t text-sm min-w-0" style={{ gridTemplateColumns: `minmax(0, 1fr) repeat(${escalaOpciones.length}, minmax(48px, 60px))` }}>
              <div className="px-2 py-2 border-r text-foreground break-words whitespace-pre-wrap leading-relaxed min-w-0">{q}</div>
              {escalaOpciones.map((o) => (
                <div key={o.value} className="flex items-center justify-center border-r last:border-r-0">
                  <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {preguntaSiNo && (
        <div className="border rounded-md p-2.5 bg-background text-sm flex items-center gap-2">
          <span className="text-foreground">{preguntaSiNo}</span>
          <div className="flex gap-2 ml-auto">
            <div className="flex items-center gap-1"><div className="h-4 w-4 rounded-full border border-muted-foreground/30" /><span className="text-muted-foreground">Sí</span></div>
            <div className="flex items-center gap-1"><div className="h-4 w-4 rounded-full border border-muted-foreground/30" /><span className="text-muted-foreground">No</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Health Consent Preview ── */
function HealthConsentPreview({ block }: { block: BloqueHealthConsent }) {
  const { questions = [] } = block.props || {};
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground">{block.label || 'Consentimiento de salud'}</span>
        <Badge variant="secondary" className="text-xs h-5 px-1.5">{questions.length} pregunta{questions.length !== 1 ? 's' : ''}</Badge>
      </div>
      {questions.map((q) => (
        <div key={q.id} className="border rounded-md p-2 bg-background flex items-center gap-2 text-sm">
          <div className="flex gap-2 shrink-0">
            <div className="flex items-center gap-1"><div className="h-4 w-4 rounded-full border border-muted-foreground/30" /><span className="text-muted-foreground">Sí</span></div>
            <div className="flex items-center gap-1"><div className="h-4 w-4 rounded-full border border-muted-foreground/30" /><span className="text-muted-foreground">No</span></div>
          </div>
          <span className="text-foreground">{q.label}</span>
          {q.hasDetail && <Badge variant="outline" className="text-xs h-4.5 px-1.5 ml-auto">Detalle</Badge>}
        </div>
      ))}
    </div>
  );
}

/* ── Data Authorization Preview ── */
function DataAuthorizationPreview({ block }: { block: BloqueDataAuthorization }) {
  const { summaryItems = [], fullText } = block.props || {};
  return (
    <div className="space-y-2">
      <span className="block text-sm font-semibold text-muted-foreground">{block.label || 'Autorización de datos'}</span>
      <div className="border rounded-md p-2.5 bg-background space-y-1.5">
        {summaryItems.map((item, i) => (
          <div key={i} className="flex items-start gap-1.5 text-sm text-foreground">
            <span className="text-muted-foreground">•</span> {item}
          </div>
        ))}
      </div>
      {fullText && <p className="text-sm text-muted-foreground line-clamp-2 italic">{fullText}</p>}
      <div className="flex items-center gap-2 text-sm">
        <div className="h-4 w-4 border rounded bg-background" />
        <span className="text-foreground">Acepto los términos</span>
      </div>
    </div>
  );
}

/* ── Document Header Preview ── */
function DocumentHeaderPreview({ block }: { block: BloqueDocumentHeader }) {
  const p = block.props || {} as any;
  const border = `1px solid ${p.borderColor || '#9ca3af'}`;

  return (
    <div className="min-w-0 max-w-full overflow-visible">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '120px 1fr 1fr',
          border,
          fontSize: '11px',
          lineHeight: '1.4',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRight: border,
          }}
        >
          {p.logoUrl ? (
            <img src={p.logoUrl} alt="Logo" style={{ maxWidth: '105px', maxHeight: '73px', objectFit: 'contain' }} />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
              <span className="text-[9px]">Logo</span>
            </div>
          )}
        </div>

        {/* Center */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: border }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '8px',
              textAlign: 'center',
            }}
          >
            {block.label || 'NOMBRE DEL DOCUMENTO'}
          </div>
          {(p.codigo || p.version) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: border }}>
              {p.codigo && (
                <div style={{ padding: '4px 8px', borderRight: border, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#6b7280' }}>Código:</span>
                  <span style={{ fontWeight: 600 }}>{p.codigo}</span>
                </div>
              )}
              {p.version && (
                <div style={{ padding: '4px 8px', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#6b7280' }}>Versión:</span>
                  <span style={{ fontWeight: 600 }}>{p.version}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, textTransform: 'uppercase', padding: '6px 8px', borderBottom: border, fontSize: '11px', lineHeight: '1.3' }}>
            {p.empresaNombre || 'Nombre empresa'}
          </div>
          <div style={{ padding: '4px 8px', borderBottom: border, fontWeight: 500 }}>
            {p.sistemaGestion || 'SGI'}
          </div>
          <div style={{ padding: '4px 8px', borderBottom: border }}>
            SUBSISTEMA: {p.subsistema || '---'}
          </div>
          {p.mostrarFechas && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ padding: '4px 8px', borderRight: border, fontSize: '10px', fontWeight: 500 }}>
                CREACIÓN: {p.fechaCreacion || '---'}
              </div>
              <div style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 500 }}>
                EDICIÓN: {p.fechaEdicion || '---'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
