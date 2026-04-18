import { useState, useCallback, useEffect } from 'react';
import { useFormatoEditorStore } from '@/modules/formatos/core/editor/useEditorStore';
import type { Bloque, TipoBloque, VisibilityRule } from '@/modules/formatos/plugins/safa';
import { AUTO_FIELD_CATALOG, AUTO_FIELD_CATEGORIES } from '@/modules/formatos/plugins/safa';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from './RichTextEditor';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  SelectGroup, SelectLabel,
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from '@/components/ui/collapsible';
import { Plus, X, ChevronDown, CheckCircle2, GripVertical, Trash2, Loader2, Upload, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface InspectorFieldsProps {
  bloque: Bloque;
  onChange: (updates: Partial<Bloque>) => void;
}

const HIDE_REQUIRED: TipoBloque[] = [
  'section_title', 'heading', 'paragraph', 'divider',
  'document_header', 'attendance_by_day',
];

export default function InspectorFields({ bloque, onChange }: InspectorFieldsProps) {
  const configNombre = useFormatoEditorStore((s) => s.config.nombre);
  const setConfig = useFormatoEditorStore((s) => s.setConfig);

  return (
    <div className="space-y-4">
      {/* Label */}
      {bloque.type !== 'divider' && (
        <div className="space-y-1.5">
          <Label className="text-xs">{bloque.type === 'document_header' ? 'Nombre del formato/documento' : 'Etiqueta'}</Label>
          <Input
            value={bloque.type === 'document_header' ? configNombre : bloque.label}
            onChange={(e) => {
              const val = e.target.value;
              onChange({ label: val });
              if (bloque.type === 'document_header') {
                setConfig({ nombre: val });
              }
            }}
            placeholder={bloque.type === 'document_header' ? 'Nombre del formato' : 'Etiqueta del campo'}
            className="h-9 text-sm"
          />
        </div>
      )}

      {/* Required toggle */}
      {!HIDE_REQUIRED.includes(bloque.type) && (
        <div className="flex items-center justify-between">
          <Label className="text-xs">Obligatorio</Label>
          <Switch
            checked={bloque.required ?? false}
            onCheckedChange={(v) => onChange({ required: v })}
          />
        </div>
      )}

      {/* Editable toggle (for auto_field and pre-filled fields) */}
      {bloque.type === 'auto_field' && (
        <div className="flex items-center justify-between">
          <Label className="text-xs">Editable por estudiante</Label>
          <Switch
            checked={(bloque as any).editable ?? false}
            onCheckedChange={(v) => onChange({ editable: v } as any)}
          />
        </div>
      )}

      {/* Type-specific */}
      <TypeSpecific bloque={bloque} onChange={onChange} />

      {/* Visibility Rule — available for all field blocks */}
      {!['divider', 'document_header'].includes(bloque.type) && (
        <VisibilityRuleInspector bloque={bloque} onChange={onChange} />
      )}
    </div>
  );
}

function TypeSpecific({ bloque, onChange }: InspectorFieldsProps) {
  const b = bloque as any;

  switch (bloque.type) {
    case 'heading': {
      const level = b.props?.level ?? 2;
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">Nivel</Label>
          <Select value={String(level)} onValueChange={(v) => onChange({ props: { level: Number(v) } } as any)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">H1 — Grande</SelectItem>
              <SelectItem value="2">H2 — Mediano</SelectItem>
              <SelectItem value="3">H3 — Pequeño</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    case 'paragraph':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">Texto del párrafo</Label>
          <RichTextEditor
            value={b.props?.text ?? ''}
            onChange={(html) => onChange({ props: { text: html } } as any)}
            placeholder="Contenido del párrafo..."
          />
        </div>
      );

    case 'text':
    case 'textarea':
    case 'email':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">Placeholder</Label>
          <Input
            value={b.props?.placeholder ?? ''}
            onChange={(e) => onChange({ props: { ...b.props, placeholder: e.target.value } } as any)}
            placeholder="Texto de ayuda..."
            className="h-9 text-sm"
          />
        </div>
      );

    case 'number':
      return (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Mínimo</Label>
            <Input
              type="number"
              value={b.props?.min ?? ''}
              onChange={(e) => onChange({ props: { ...b.props, min: e.target.value === '' ? undefined : Number(e.target.value) } } as any)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Máximo</Label>
            <Input
              type="number"
              value={b.props?.max ?? ''}
              onChange={(e) => onChange({ props: { ...b.props, max: e.target.value === '' ? undefined : Number(e.target.value) } } as any)}
              className="h-9 text-sm"
            />
          </div>
        </div>
      );

    case 'radio':
    case 'select':
    case 'multi_choice': {
      const options: { value: string; label: string; default?: boolean }[] = b.props?.options ?? [];
      const isRadio = bloque.type === 'radio';
      const isMulti = bloque.type === 'multi_choice';
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Opciones</Label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="space-y-1 border rounded-md p-2 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-1">
                      <Input
                        value={opt.label}
                        onChange={(e) => {
                          const updated = options.map((o, i) => i === idx ? { ...o, label: e.target.value } : o);
                          onChange({ props: { ...b.props, options: updated } } as any);
                        }}
                        placeholder="Etiqueta"
                        className="h-8 text-sm"
                      />
                      <Input
                        value={opt.value}
                        onChange={(e) => {
                          const updated = options.map((o, i) => i === idx ? { ...o, value: e.target.value } : o);
                          onChange({ props: { ...b.props, options: updated } } as any);
                        }}
                        placeholder="Valor"
                        className="h-8 text-sm font-mono text-muted-foreground"
                      />
                    </div>
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (options.length <= 1) return;
                        onChange({ props: { ...b.props, options: options.filter((_, i) => i !== idx) } } as any);
                      }}
                      disabled={options.length <= 1}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {/* Default toggle per option */}
                  <div className="flex items-center gap-2 pt-1">
                    <Switch
                      checked={opt.default ?? false}
                      onCheckedChange={(v) => {
                        let updated;
                        if (isRadio || bloque.type === 'select') {
                          // Single default: uncheck all others
                          updated = options.map((o, i) => ({ ...o, default: i === idx ? v : false }));
                        } else {
                          // Multi default
                          updated = options.map((o, i) => i === idx ? { ...o, default: v } : o);
                        }
                        onChange({ props: { ...b.props, options: updated } } as any);
                      }}
                    />
                    <Label className="text-xs text-muted-foreground">Seleccionado por defecto</Label>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline" size="sm" className="w-full"
              onClick={() => {
                const n = options.length + 1;
                onChange({ props: { ...b.props, options: [...options, { value: `opcion_${n}`, label: `Opción ${n}`, default: false }] } } as any);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Agregar opción
            </Button>
          </div>
          {isMulti && (
            <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
              <p className="text-xs text-blue-700">Permite seleccionar varias opciones simultáneamente</p>
            </div>
          )}
        </div>
      );
    }

    case 'auto_field': {
      const currentKey = b.props?.key ?? '';
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Campo del sistema</Label>
            <Select
              value={currentKey}
              onValueChange={(v) => onChange({ props: { ...b.props, key: v } } as any)}
            >
              <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar campo..." /></SelectTrigger>
              <SelectContent>
                {AUTO_FIELD_CATEGORIES.map((cat) => (
                  <SelectGroup key={cat}>
                    <SelectLabel>{cat}</SelectLabel>
                    {AUTO_FIELD_CATALOG.filter((f) => f.category === cat).map((f) => (
                      <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2">
            <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 border-blue-300">Auto</Badge>
            <p className="text-xs text-blue-700">Se llena automáticamente desde el sistema</p>
          </div>
        </div>
      );
    }

    case 'file':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">Tipos aceptados</Label>
          <Input
            value={b.props?.accept ?? '.pdf,.jpg,.png'}
            onChange={(e) => onChange({ props: { ...b.props, accept: e.target.value } } as any)}
            placeholder=".pdf,.jpg,.png"
            className="h-9 text-sm font-mono"
          />
        </div>
      );

    case 'checkbox':
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Descripción</Label>
            <Textarea
              value={b.props?.description ?? ''}
              onChange={(e) => onChange({ props: { ...b.props, description: e.target.value } } as any)}
              placeholder="Texto descriptivo antes de la casilla..."
              className="min-h-[60px] text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">Popover con texto extenso</Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">Muestra "Ver más" con el texto completo</p>
            </div>
            <Switch
              checked={b.props?.hasPopover ?? false}
              onCheckedChange={(v) => onChange({ props: { ...b.props, hasPopover: v } } as any)}
            />
          </div>
          {b.props?.hasPopover && (
            <div className="space-y-1.5">
              <Label className="text-xs">Texto completo del popover</Label>
              <Textarea
                value={b.props?.popoverText ?? ''}
                onChange={(e) => onChange({ props: { ...b.props, popoverText: e.target.value } } as any)}
                placeholder="Texto legal o informativo extenso..."
                className="min-h-[100px] text-sm"
              />
            </div>
          )}
        </div>
      );

    /* Legacy signature blocks removed — use signature_capture instead */

    case 'signature_capture':
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Modo</Label>
            <Select value={b.props?.mode || 'capture'} onValueChange={(v) => onChange({ props: { ...b.props, mode: v } } as any)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="capture">Captura nueva</SelectItem>
                <SelectItem value="reuse_if_available">Reutilizar si disponible</SelectItem>
                <SelectItem value="reuse_required">Solo reutilizar</SelectItem>
                <SelectItem value="display_only">Solo mostrar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de firmante</Label>
            <Select value={b.props?.tipoFirmante || 'aprendiz'} onValueChange={(v) => onChange({ props: { ...b.props, tipoFirmante: v } } as any)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aprendiz">Aprendiz</SelectItem>
                <SelectItem value="entrenador">Entrenador</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
            {b.props?.mode === 'reuse_if_available'
              ? 'Reutiliza una firma existente; si no hay, permite capturar.'
              : b.props?.mode === 'reuse_required'
              ? 'Solo muestra una firma reutilizada. Si no existe, queda bloqueado.'
              : b.props?.mode === 'display_only'
              ? 'Solo muestra la firma existente, sin captura.'
              : 'Captura una firma nueva del firmante.'}
          </p>
        </div>
      );

    case 'evaluation_quiz':
      return <EvaluationQuizInspector bloque={bloque} onChange={onChange} />;

    case 'satisfaction_survey':
      return <SatisfactionSurveyInspector bloque={bloque} onChange={onChange} />;

    case 'health_consent':
      return <HealthConsentInspector bloque={bloque} onChange={onChange} />;

    /* data_authorization block removed — use paragraph + checkbox instead */

    case 'attendance_by_day':
      return <AttendanceByDayInspector bloque={bloque} onChange={onChange} />;

    case 'document_header':
      return <DocumentHeaderInspector bloque={bloque} onChange={onChange} />;

    case 'section_title': {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Colapsable</Label>
            <Switch
              checked={b.props?.collapsible ?? false}
              onCheckedChange={(v) => onChange({ props: { ...b.props, collapsible: v } } as any)}
            />
          </div>
          {b.props?.collapsible && (
            <div className="flex items-center justify-between">
              <Label className="text-xs">Abierto por defecto</Label>
              <Switch
                checked={b.props?.defaultOpen !== false}
                onCheckedChange={(v) => onChange({ props: { ...b.props, defaultOpen: v } } as any)}
              />
            </div>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

/* ═══════════════════════════════════════════════════════════
   Evaluation Quiz Inspector
   ═══════════════════════════════════════════════════════════ */

function EvaluationQuizInspector({ bloque, onChange }: InspectorFieldsProps) {
  const b = bloque as any;
  const props = b.props || { umbralAprobacion: 70, preguntas: [] };
  const preguntas = props.preguntas || [];

  const updateProps = (upd: any) => onChange({ props: { ...props, ...upd } } as any);

  const updatePregunta = (idx: number, upd: any) => {
    const updated = preguntas.map((p: any, i: number) => i === idx ? { ...p, ...upd } : p);
    updateProps({ preguntas: updated });
  };

  const addPregunta = () => {
    const id = preguntas.length > 0 ? Math.max(...preguntas.map((p: any) => p.id)) + 1 : 1;
    updateProps({
      preguntas: [...preguntas, { id, texto: '', opciones: ['Opción A', 'Opción B'], correcta: 0 }],
    });
  };

  const removePregunta = (idx: number) => {
    updateProps({ preguntas: preguntas.filter((_: any, i: number) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      {/* Umbral */}
      <div className="space-y-1.5">
        <Label className="text-sm">Umbral de aprobación</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0} max={100}
            value={props.umbralAprobacion ?? 70}
            onChange={(e) => updateProps({ umbralAprobacion: Number(e.target.value) })}
            className="h-9 text-sm w-20"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
        <p className="text-sm text-amber-800">
          Se aprueba con {props.umbralAprobacion ?? 70}% — {preguntas.length} pregunta{preguntas.length !== 1 ? 's' : ''} configurada{preguntas.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Preguntas */}
      <div className="space-y-2">
        <Label className="text-sm">Preguntas</Label>
        {preguntas.map((p: any, idx: number) => (
          <QuestionEditor
            key={p.id}
            question={p}
            index={idx}
            onUpdate={(upd) => updatePregunta(idx, upd)}
            onRemove={() => removePregunta(idx)}
          />
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={addPregunta}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Agregar pregunta
        </Button>
      </div>
    </div>
  );
}

function QuestionEditor({ question, index, onUpdate, onRemove }: {
  question: any;
  index: number;
  onUpdate: (upd: any) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);
  const opciones: string[] = question.opciones || [];

  return (
      <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-md overflow-hidden min-w-0 max-w-full">
        <CollapsibleTrigger asChild>
          <div className="flex items-start gap-2 px-2 py-1.5 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors min-w-0 max-w-full">
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0 mt-0.5 ${open ? '' : '-rotate-90'}`} />
            <span className="text-sm font-medium flex-1 min-w-0 break-words whitespace-normal leading-relaxed pr-1">
              {index + 1}. {question.texto || 'Sin texto'}
            </span>
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-2 space-y-2 border-t min-w-0 max-w-full overflow-x-hidden">
            <Textarea
              value={question.texto}
              onChange={(e) => onUpdate({ texto: e.target.value })}
              placeholder="Texto de la pregunta..."
              className="min-h-[72px] text-sm resize-y break-words"
            />
            <Label className="text-xs text-muted-foreground">Opciones (selecciona la correcta)</Label>
            {opciones.map((op: string, oi: number) => (
              <div key={oi} className="flex items-start gap-1.5 min-w-0 max-w-full">
                <button
                  type="button"
                  onClick={() => onUpdate({ correcta: oi })}
                  className={`h-4 w-4 rounded-full border-2 shrink-0 transition-colors mt-1 ${oi === question.correcta ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground/40 hover:border-emerald-400'}`}
                >
                  {oi === question.correcta && <CheckCircle2 className="h-3 w-3 text-white" />}
                </button>
                <Textarea
                  value={op}
                  onChange={(e) => {
                    const updated = opciones.map((o, i) => i === oi ? e.target.value : o);
                    onUpdate({ opciones: updated });
                  }}
                  className="min-h-[52px] text-sm flex-1 resize-y"
                />
                <Button
                  variant="ghost" size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (opciones.length <= 2) return;
                    const filtered = opciones.filter((_, i) => i !== oi);
                    const newCorrecta = question.correcta >= filtered.length ? filtered.length - 1 : question.correcta > oi ? question.correcta - 1 : question.correcta;
                    onUpdate({ opciones: filtered, correcta: newCorrecta });
                  }}
                  disabled={opciones.length <= 2}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost" size="sm" className="w-full text-sm h-8"
              onClick={() => onUpdate({ opciones: [...opciones, `Opción ${opciones.length + 1}`] })}
            >
              <Plus className="h-3 w-3 mr-1" /> Opción
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/* ═══════════════════════════════════════════════════════════
   Satisfaction Survey Inspector
   ═══════════════════════════════════════════════════════════ */

function SatisfactionSurveyInspector({ bloque, onChange }: InspectorFieldsProps) {
  const b = bloque as any;
  const props = b.props || { escalaPreguntas: [], escalaOpciones: [], preguntaSiNo: '' };
  const escalaPreguntas: string[] = props.escalaPreguntas || [];
  const escalaOpciones: { value: string; label: string }[] = props.escalaOpciones || [];
  const preguntaSiNo: string = props.preguntaSiNo || '';

  const updateProps = (upd: any) => onChange({ props: { ...props, ...upd } } as any);

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="bg-muted/50 border rounded-md px-3 py-2">
        <p className="text-sm text-muted-foreground">
          {escalaPreguntas.length} pregunta{escalaPreguntas.length !== 1 ? 's' : ''} de escala
          {preguntaSiNo ? ' + 1 pregunta Sí/No' : ''}
        </p>
      </div>

      {/* Escala opciones */}
      <div className="space-y-1.5">
        <Label className="text-sm">Opciones de escala</Label>
        {escalaOpciones.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <Input
              value={opt.value}
              onChange={(e) => {
                const updated = escalaOpciones.map((o, i) => i === idx ? { ...o, value: e.target.value } : o);
                updateProps({ escalaOpciones: updated });
              }}
              placeholder="Valor"
              className="h-8 text-sm w-14 font-mono text-center"
            />
            <Input
              value={opt.label}
              onChange={(e) => {
                const updated = escalaOpciones.map((o, i) => i === idx ? { ...o, label: e.target.value } : o);
                updateProps({ escalaOpciones: updated });
              }}
              placeholder="Etiqueta"
              className="h-8 text-sm flex-1"
            />
            <Button
              variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => {
                if (escalaOpciones.length <= 1) return;
                updateProps({ escalaOpciones: escalaOpciones.filter((_, i) => i !== idx) });
              }}
              disabled={escalaOpciones.length <= 1}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button
          variant="ghost" size="sm" className="w-full text-sm h-8"
          onClick={() => {
            const n = escalaOpciones.length + 1;
            updateProps({ escalaOpciones: [...escalaOpciones, { value: String(n), label: `Opción ${n}` }] });
          }}
        >
          <Plus className="h-3 w-3 mr-1" /> Opción de escala
        </Button>
      </div>

      {/* Preguntas de escala */}
      <div className="space-y-1.5">
        <Label className="text-sm">Preguntas de escala</Label>
        {escalaPreguntas.map((q, idx) => (
          <div key={idx} className="flex items-start gap-1.5 min-w-0 max-w-full">
            <span className="text-xs text-muted-foreground w-4 shrink-0">{idx + 1}.</span>
            <Textarea
              value={q}
              onChange={(e) => {
                const updated = escalaPreguntas.map((p, i) => i === idx ? e.target.value : p);
                updateProps({ escalaPreguntas: updated });
              }}
              className="min-h-[60px] text-sm flex-1 resize-y"
            />
            <Button
              variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => updateProps({ escalaPreguntas: escalaPreguntas.filter((_, i) => i !== idx) })}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button
          variant="ghost" size="sm" className="w-full text-sm h-8"
          onClick={() => updateProps({ escalaPreguntas: [...escalaPreguntas, ''] })}
        >
          <Plus className="h-3 w-3 mr-1" /> Pregunta
        </Button>
      </div>

      {/* Pregunta Sí/No */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Pregunta Sí/No</Label>
          <Switch
            checked={!!preguntaSiNo}
            onCheckedChange={(v) => updateProps({ preguntaSiNo: v ? '¿Recomendaría este curso?' : '' })}
          />
        </div>
        {preguntaSiNo && (
          <Textarea
            value={preguntaSiNo}
            onChange={(e) => updateProps({ preguntaSiNo: e.target.value })}
            className="min-h-[60px] text-sm resize-y"
          />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Health Consent Inspector
   ═══════════════════════════════════════════════════════════ */

function HealthConsentInspector({ bloque, onChange }: InspectorFieldsProps) {
  const b = bloque as any;
  const props = b.props || { questions: [] };
  const questions = props.questions || [];

  const updateProps = (upd: any) => onChange({ props: { ...props, ...upd } } as any);

  const updateQuestion = (idx: number, upd: any) => {
    const updated = questions.map((q: any, i: number) => i === idx ? { ...q, ...upd } : q);
    updateProps({ questions: updated });
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm">Preguntas de salud</Label>
      {questions.map((q: any, idx: number) => (
        <div key={q.id} className="border rounded-md p-2 space-y-1.5 min-w-0 max-w-full">
          <div className="flex items-start gap-1.5 min-w-0 max-w-full">
            <Textarea
              value={q.label}
              onChange={(e) => updateQuestion(idx, { label: e.target.value })}
              className="min-h-[60px] text-sm flex-1 resize-y"
              placeholder="Texto de la pregunta"
            />
            <Button
              variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => updateProps({ questions: questions.filter((_: any, i: number) => i !== idx) })}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Switch
                checked={q.hasDetail ?? false}
                onCheckedChange={(v) => updateQuestion(idx, { hasDetail: v })}
              />
              <Label className="text-xs">Detalle</Label>
            </div>
            {q.hasDetail && (
              <Input
                value={q.conditionalOn || ''}
                onChange={(e) => updateQuestion(idx, { conditionalOn: e.target.value })}
                placeholder="Condicional (ID)"
                className="h-8 text-xs w-28"
              />
            )}
          </div>
        </div>
      ))}
      <Button
        variant="outline" size="sm" className="w-full"
        onClick={() => {
          const id = `hc_${Date.now()}`;
          updateProps({ questions: [...questions, { id, label: '', hasDetail: false }] });
        }}
      >
        <Plus className="h-3.5 w-3.5 mr-1" /> Agregar pregunta
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Data Authorization Inspector
   ═══════════════════════════════════════════════════════════ */

function DataAuthorizationInspector({ bloque, onChange }: InspectorFieldsProps) {
  const b = bloque as any;
  const props = b.props || { summaryItems: [], fullText: '' };
  const summaryItems: string[] = props.summaryItems || [];

  const updateProps = (upd: any) => onChange({ props: { ...props, ...upd } } as any);

  return (
    <div className="space-y-3">
      {/* Summary items */}
      <div className="space-y-1.5">
        <Label className="text-sm">Puntos del resumen</Label>
        {summaryItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground w-4 shrink-0">•</span>
            <Input
              value={item}
              onChange={(e) => {
                const updated = summaryItems.map((s, i) => i === idx ? e.target.value : s);
                updateProps({ summaryItems: updated });
              }}
              className="h-8 text-sm flex-1"
            />
            <Button
              variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => updateProps({ summaryItems: summaryItems.filter((_, i) => i !== idx) })}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button
          variant="ghost" size="sm" className="w-full text-sm h-8"
          onClick={() => updateProps({ summaryItems: [...summaryItems, ''] })}
        >
          <Plus className="h-3 w-3 mr-1" /> Punto
        </Button>
      </div>

      {/* Full text */}
      <div className="space-y-1.5">
        <Label className="text-sm">Texto completo de autorización</Label>
        <Textarea
          value={props.fullText || ''}
          onChange={(e) => updateProps({ fullText: e.target.value })}
          placeholder="Texto legal completo..."
          className="min-h-[100px] text-sm"
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Document Header Inspector
   ═══════════════════════════════════════════════════════════ */

function DocumentHeaderInspector({ bloque, onChange }: InspectorFieldsProps) {
  const b = bloque as any;
  const props = b.props || {};

  const updateProps = (upd: any) => onChange({ props: { ...props, ...upd } } as any);

  const [uploading, setUploading] = useState(false);
  const [galleryLogos, setGalleryLogos] = useState<{ name: string; url: string }[]>([]);
  const [showGallery, setShowGallery] = useState(false);

  // Load existing logos from storage bucket
  useEffect(() => {
    const loadLogos = async () => {
      const { data } = await supabase.storage.from('logos-formatos').list('', { limit: 50 });
      if (data) {
        const items = data
          .filter((f) => f.name && !f.name.startsWith('.'))
          .map((f) => {
            const { data: urlData } = supabase.storage.from('logos-formatos').getPublicUrl(f.name);
            return { name: f.name, url: urlData.publicUrl };
          });
        setGalleryLogos(items);
      }
    };
    loadLogos();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('logos-formatos').upload(fileName, file, { upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('logos-formatos').getPublicUrl(fileName);
      updateProps({ logoUrl: urlData.publicUrl });
      // Add to gallery
      setGalleryLogos((prev) => [...prev, { name: fileName, url: urlData.publicUrl }]);
    } catch (err: any) {
      console.error('Error uploading logo:', err);
    } finally {
      setUploading(false);
    }
  };

  // Check if current logo is a base64 and needs migration
  const isBase64 = props.logoUrl?.startsWith('data:');

  return (
    <div className="space-y-4">
      {/* Logo */}
      <div className="space-y-1.5">
        <Label className="text-xs">Logo</Label>
        {isBase64 && (
          <p className="text-[10px] text-amber-600">⚠ Logo almacenado como Base64. Suba uno nuevo para optimizar.</p>
        )}
        {props.logoUrl ? (
          <div className="relative border rounded-md p-2 flex items-center justify-center bg-muted/20">
            <img src={props.logoUrl} alt="Logo" className="max-h-16 object-contain" />
            <Button
              variant="ghost" size="icon"
              className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => updateProps({ logoUrl: '' })}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                className="flex-1 text-xs"
                onClick={() => setShowGallery(!showGallery)}
                disabled={galleryLogos.length === 0}
              >
                <ImageIcon className="h-3 w-3 mr-1" />
                Galería ({galleryLogos.length})
              </Button>
              <label className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-xs" asChild disabled={uploading}>
                  <span>
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                    Subir nuevo
                  </span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
              </label>
            </div>
            {showGallery && galleryLogos.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto border rounded-md p-1.5">
                {galleryLogos.map((logo) => (
                  <button
                    key={logo.name}
                    type="button"
                    className="border rounded p-1 hover:ring-2 hover:ring-primary/50 transition-all"
                    onClick={() => updateProps({ logoUrl: logo.url })}
                  >
                    <img src={logo.url} alt={logo.name} className="h-8 w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empresa */}
      <div className="space-y-1.5">
        <Label className="text-xs">Nombre empresa</Label>
        <Textarea
          value={props.empresaNombre || ''}
          onChange={(e) => updateProps({ empresaNombre: e.target.value })}
          className="min-h-[60px] text-xs resize-y"
        />
      </div>

      {/* SGI */}
      <div className="space-y-1.5">
        <Label className="text-xs">Sistema de gestión</Label>
        <Input
          value={props.sistemaGestion || ''}
          onChange={(e) => updateProps({ sistemaGestion: e.target.value })}
          className="h-9 text-sm"
        />
      </div>

      {/* Subsistema */}
      <div className="space-y-1.5">
        <Label className="text-xs">Subsistema</Label>
        <Input
          value={props.subsistema || ''}
          onChange={(e) => updateProps({ subsistema: e.target.value })}
          className="h-9 text-sm"
        />
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Fecha creación</Label>
          <Input
            value={props.fechaCreacion || ''}
            onChange={(e) => updateProps({ fechaCreacion: e.target.value })}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Fecha edición</Label>
          <Input
            value={props.fechaEdicion || ''}
            onChange={(e) => updateProps({ fechaEdicion: e.target.value })}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Código y versión */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Código</Label>
          <Input
            value={props.mostrarCodigo === false ? '' : (props.codigo || '')}
            onChange={(e) => updateProps({ mostrarCodigo: !!e.target.value, codigo: e.target.value })}
            placeholder="Ej: FIH04-013"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Versión</Label>
          <Input
            value={props.mostrarVersion === false ? '' : (props.version || '')}
            onChange={(e) => updateProps({ mostrarVersion: !!e.target.value, version: e.target.value })}
            placeholder="Ej: 001"
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Color de borde */}
      <div className="space-y-1.5">
        <Label className="text-xs">Color de bordes</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={props.borderColor || '#9ca3af'}
            onChange={(e) => updateProps({ borderColor: e.target.value })}
            className="h-8 w-10 rounded border cursor-pointer"
          />
          <Input
            value={props.borderColor || '#9ca3af'}
            onChange={(e) => updateProps({ borderColor: e.target.value })}
            className="h-9 text-sm font-mono flex-1"
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Visibility Rule Inspector
   ═══════════════════════════════════════════════════════════ */

function VisibilityRuleInspector({ bloque, onChange }: InspectorFieldsProps) {
  const items = useFormatoEditorStore((s) => s.items);
  const rule = (bloque as any).visibilityRule as VisibilityRule | undefined;
  const hasRule = !!rule?.field;

  // Get all field blocks that could be referenced
  const fieldBlocks: { id: string; label: string }[] = [];
  for (const item of items) {
    if ('type' in item && item.type !== 'row2') {
      const b = item as Bloque;
      if (['text', 'number', 'radio', 'select', 'checkbox', 'date', 'email', 'textarea'].includes(b.type) && b.id !== bloque.id) {
        fieldBlocks.push({ id: b.id, label: b.label || b.id });
      }
    } else if ('cols' in item) {
      for (const col of (item as any).cols) {
        if (col && ['text', 'number', 'radio', 'select', 'checkbox', 'date', 'email', 'textarea'].includes(col.type) && col.id !== bloque.id) {
          fieldBlocks.push({ id: col.id, label: col.label || col.id });
        }
      }
    }
  }

  if (fieldBlocks.length === 0) return null;

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between text-xs h-8">
          Visibilidad condicional
          <ChevronDown className="h-3 w-3" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Activar regla</Label>
          <Switch
            checked={hasRule}
            onCheckedChange={(v) => {
              if (v) {
                onChange({ visibilityRule: { field: '', operator: 'is_filled' } } as any);
              } else {
                onChange({ visibilityRule: undefined } as any);
              }
            }}
          />
        </div>

        {hasRule && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Campo a evaluar</Label>
              <Select
                value={rule?.field || ''}
                onValueChange={(v) => onChange({ visibilityRule: { ...rule, field: v } } as any)}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar campo..." /></SelectTrigger>
                <SelectContent>
                  {fieldBlocks.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Condición</Label>
              <Select
                value={rule?.operator || 'is_filled'}
                onValueChange={(v) => onChange({ visibilityRule: { ...rule, operator: v } } as any)}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="is_filled">Tiene valor</SelectItem>
                  <SelectItem value="is_empty">Está vacío</SelectItem>
                  <SelectItem value="equals">Es igual a</SelectItem>
                  <SelectItem value="not_equals">Es diferente de</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(rule?.operator === 'equals' || rule?.operator === 'not_equals') && (
              <div className="space-y-1.5">
                <Label className="text-xs">Valor</Label>
                <Input
                  value={String(rule?.value ?? '')}
                  onChange={(e) => onChange({ visibilityRule: { ...rule, value: e.target.value } } as any)}
                  className="h-8 text-xs"
                  placeholder="Valor a comparar"
                />
              </div>
            )}
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ═══════════════════════════════════════════════════════════
   Attendance By Day Inspector
   ═══════════════════════════════════════════════════════════ */

function AttendanceByDayInspector({ bloque, onChange }: InspectorFieldsProps) {
  const b = bloque as any;
  const props = b.props || {};
  const firmaMode = props.firmaMode || 'none';

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
        Genera automáticamente la tabla de asistencia según los días del curso.
      </p>

      <div className="space-y-1.5">
        <Label className="text-xs">Firma heredada</Label>
        <Select
          value={firmaMode}
          onValueChange={(v) => onChange({ props: { ...props, firmaMode: v } } as any)}
        >
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin firma</SelectItem>
            <SelectItem value="reuse_if_available">Reutilizar si disponible</SelectItem>
            <SelectItem value="reuse_required">Solo reutilizar (obligatoria)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {firmaMode !== 'none' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de firmante</Label>
            <Select
              value={props.tipoFirmante || 'aprendiz'}
              onValueChange={(v) => onChange({ props: { ...props, tipoFirmante: v } } as any)}
            >
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aprendiz">Aprendiz</SelectItem>
                <SelectItem value="entrenador">Entrenador</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
            La firma heredada se resuelve en instancias reales del formato (por matrícula), no en esta maqueta de diseño.
          </p>
        </>
      )}
    </div>
  );
}
