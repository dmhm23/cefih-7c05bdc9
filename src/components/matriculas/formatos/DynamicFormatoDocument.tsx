import React, { useState, useRef, useCallback, useEffect } from "react";
import DOMPurify from "dompurify";
import DocumentHeader from "@/components/shared/DocumentHeader";
import { getAutoFieldLabel } from "@/data/autoFieldCatalog";
import { resolveAutoFieldValue, AutoFieldContext } from "@/utils/resolveAutoField";
import type { FormatoFormacion, Bloque, AutoFieldKey, FirmaMatricula, FormatoRespuesta, BloqueSignatureCapture, SignatureCaptureMode } from "@/types/formatoFormacion";
import type { Row2Block, Row1Block } from "@/stores/useFormatoEditorStore";
import type { Persona } from "@/types/persona";
import type { Matricula } from "@/types/matricula";
import type { Curso } from "@/types/curso";
import type { Personal } from "@/types/personal";
import { format, addDays, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import { parseLocalDate } from "@/utils/dateUtils";
import { ChevronDown } from "lucide-react";
import BloqueHealthConsentRenderer from "./bloques/BloqueHealthConsentRenderer";
import BloqueDataAuthorizationRenderer from "./bloques/BloqueDataAuthorizationRenderer";
import BloqueEvaluationQuizRenderer from "./bloques/BloqueEvaluationQuizRenderer";
import BloqueSatisfactionSurveyRenderer from "./bloques/BloqueSatisfactionSurveyRenderer";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FieldCell({ label, value, badge, span }: { label: string; value: string; badge?: string; span?: boolean }) {
  return (
    <div className="field-cell" style={span ? { gridColumn: "span 2" } : undefined}>
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground leading-tight flex items-center gap-1">
        {label}
        {badge && (
          <span className="inline-flex items-center rounded-full border px-1.5 py-0 text-[8px] font-semibold bg-blue-50 text-blue-700 border-blue-200">
            {badge}
          </span>
        )}
      </p>
      <p className="text-sm font-medium leading-snug">{value}</p>
    </div>
  );
}

function EditableFieldCell({
  label, value, onChange, readOnly, span,
}: { label: string; value: string; onChange?: (v: string) => void; readOnly?: boolean; span?: boolean }) {
  if (readOnly || !onChange) return <FieldCell label={label} value={value || "—"} span={span} />;
  return (
    <div className="field-cell" style={span ? { gridColumn: "span 2" } : undefined}>
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground leading-tight">{label}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-2 py-1 text-sm bg-background"
      />
    </div>
  );
}

function SignatureBox({ label, imageBase64, name }: { label: string; imageBase64?: string | null; name?: string }) {
  return (
    <div className="mt-4">
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-2">{label}</p>
      <div className="border-2 border-dashed border-muted rounded h-24 flex flex-col items-center justify-center">
        {imageBase64 ? (
          <img src={imageBase64} alt={label} className="max-h-16 object-contain" />
        ) : (
          <p className="text-sm text-muted-foreground italic">Firma no registrada</p>
        )}
        {name && <p className="text-[10px] text-muted-foreground/60 mt-1">{name}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signature capture block component
// ---------------------------------------------------------------------------

function SignatureCaptureBlock({ bloque, rc }: { bloque: BloqueSignatureCapture; rc: RenderContext }) {
  const { ctx, answers, onChange, readOnly } = rc;
  const mode: SignatureCaptureMode = bloque.props?.mode || 'capture';
  const tipoFirmante = bloque.props?.tipoFirmante || 'aprendiz';
  const formatoOrigenId = bloque.props?.formatoOrigenId;

  // Try to resolve reusable signature
  const firmas = ctx.firmasMatricula || [];
  const eligible = firmas.filter(f => f.tipo === tipoFirmante && f.autorizaReutilizacion);
  let reusable: FirmaMatricula | null = null;
  if (formatoOrigenId) {
    reusable = eligible.find(f => f.formatoOrigenId === formatoOrigenId) || null;
  } else if (eligible.length > 0) {
    reusable = eligible.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }

  const existingCapture = answers[bloque.id] as string | undefined;

  // Display-only mode
  if (mode === 'display_only') {
    const img = reusable?.firmaBase64 || existingCapture;
    return (
      <SignatureBox
        label={bloque.label || `Firma ${tipoFirmante}`}
        imageBase64={img || null}
      />
    );
  }

  // Reuse required but no signature
  if (mode === 'reuse_required' && !reusable) {
    return (
      <div className="mt-4" style={{ gridColumn: "span 2" }}>
        <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-2">{bloque.label || `Firma ${tipoFirmante}`}</p>
        <div className="border-2 border-dashed border-destructive/40 rounded h-24 flex items-center justify-center">
          <p className="text-sm text-destructive italic">Firma requerida — complete primero el formato origen</p>
        </div>
      </div>
    );
  }

  // Reuse available
  if ((mode === 'reuse_if_available' || mode === 'reuse_required') && reusable) {
    return (
      <SignatureBox
        label={bloque.label || `Firma ${tipoFirmante}`}
        imageBase64={reusable.firmaBase64}
      />
    );
  }

  // Capture mode (or reuse_if_available without existing)
  if (readOnly) {
    return (
      <SignatureBox
        label={bloque.label || `Firma ${tipoFirmante}`}
        imageBase64={existingCapture || null}
      />
    );
  }

  // Interactive capture canvas
  return (
    <div className="mt-4" style={{ gridColumn: "span 2" }}>
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-2">{bloque.label || `Firma ${tipoFirmante}`}</p>
      {existingCapture ? (
        <div className="space-y-2">
          <div className="border rounded h-24 flex items-center justify-center bg-muted/10">
            <img src={existingCapture} alt="Firma capturada" className="max-h-16 object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-600 font-medium">✓ Firma lista</span>
            <button
              type="button"
              onClick={() => onChange?.(bloque.id, undefined)}
              className="text-xs text-destructive underline"
            >
              Limpiar
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-primary/30 rounded p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            La captura de firma se habilitará al enviar desde el portal
          </p>
          <p className="text-xs text-muted-foreground italic">
            (Bloque signature_capture — modo: {mode})
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Block renderer
// ---------------------------------------------------------------------------

const FIRMA_KEYS = new Set<string>(["aprendiz_firma", "entrenador_firma", "supervisor_firma"]);

interface RenderContext {
  ctx: AutoFieldContext;
  answers: Record<string, unknown>;
  onChange?: (key: string, value: unknown) => void;
  readOnly: boolean;
  formatoRef?: { nombre: string; codigo: string; version: string; documentMeta?: any };
}

function renderBloque(bloque: Bloque, rc: RenderContext): React.ReactNode {
  const { ctx, answers, onChange, readOnly } = rc;

  // Handle row1
  if ((bloque as any).type === 'row1') {
    const row = bloque as unknown as Row1Block;
    const children = Array.isArray(row.col) ? row.col : [];
    if (children.length === 0) return null;
    return (
      <div style={{ gridColumn: "span 2" }} className="grid grid-cols-2 gap-x-6 gap-y-2">
        {children.map((child) => (
          <React.Fragment key={child.id}>{renderBloque(child, rc)}</React.Fragment>
        ))}
      </div>
    );
  }

  // Handle row2 before switch (type not in Bloque union)
  if ((bloque as any).type === 'row2') {
    const row = bloque as unknown as Row2Block;
    return (
      <div style={{ gridColumn: "span 2" }} className="grid grid-cols-2 gap-x-6 gap-y-2">
        <div>{row.cols[0].map((child) => <React.Fragment key={child.id}>{renderBloque(child, rc)}</React.Fragment>)}</div>
        <div>{row.cols[1].map((child) => <React.Fragment key={child.id}>{renderBloque(child, rc)}</React.Fragment>)}</div>
      </div>
    );
  }

  switch (bloque.type) {
    case "section_title": {
      const isCollapsible = ("props" in bloque && (bloque as any).props?.collapsible) || false;
      if (isCollapsible) {
        return <CollapsibleSection bloque={bloque} rc={rc} />;
      }
      return (
        <div className="field-span" style={{ gridColumn: "span 2" }}>
          <div className="section-title flex items-center gap-2 border-b border-border pb-1 mt-5 mb-3">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.1em]">
              {bloque.label || "Sección sin título"}
            </h2>
          </div>
        </div>
      );
    }

    case "heading": {
      const level = ("props" in bloque && (bloque as any).props?.level) || 2;
      const sizeClass = level === 1 ? "text-lg" : level === 2 ? "text-base" : "text-sm";
      return (
        <div style={{ gridColumn: "span 2" }}>
          <h3 className={`${sizeClass} font-bold mt-3`}>{bloque.label || "Encabezado"}</h3>
        </div>
      );
    }

    case "paragraph": {
      const rawHtml = ("props" in bloque && (bloque as any).props?.text) || "";
      const isHtml = /<[a-z][\s\S]*>/i.test(rawHtml);
      return (
        <div style={{ gridColumn: "span 2" }}>
          {isHtml ? (
            <div
              className="text-sm leading-relaxed text-justify prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawHtml) }}
            />
          ) : (
            <p className="text-sm leading-relaxed text-justify">{rawHtml}</p>
          )}
        </div>
      );
    }

    case "text":
      return (
        <EditableFieldCell
          label={bloque.label || "Campo de texto"}
          value={(answers[bloque.id] as string) || ""}
          onChange={!readOnly && onChange ? (v) => onChange(bloque.id, v) : undefined}
          readOnly={readOnly}
        />
      );

    case "date":
      return (
        <EditableFieldCell
          label={bloque.label || "Fecha"}
          value={(answers[bloque.id] as string) || ""}
          onChange={!readOnly && onChange ? (v) => onChange(bloque.id, v) : undefined}
          readOnly={readOnly}
        />
      );

    case "number":
      return (
        <EditableFieldCell
          label={bloque.label || "Número"}
          value={(answers[bloque.id] as string) || ""}
          onChange={!readOnly && onChange ? (v) => onChange(bloque.id, v) : undefined}
          readOnly={readOnly}
        />
      );

    case "radio": {
      const options = ("props" in bloque && (bloque as any).props?.options) || [];
      const selected = answers[bloque.id] as string | undefined;
      return (
        <div className="field-cell">
          <p className="text-sm font-medium text-foreground leading-tight mb-1">{bloque.label || "Selección"}</p>
          <div className="flex flex-wrap gap-3 mt-1">
            {options.map((opt: any) => (
              <button
                key={opt.value}
                type="button"
                disabled={readOnly}
                onClick={() => !readOnly && onChange?.(bloque.id, opt.value)}
                className={`flex items-center gap-1.5 ${!readOnly ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`h-4 w-4 rounded-full border-2 ${
                  selected === opt.value ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                }`} />
                <span className="text-sm">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    case "multi_choice": {
      const options = ("props" in bloque && (bloque as any).props?.options) || [];
      const selected = (answers[bloque.id] as string[]) || [];
      return (
        <div className="field-cell">
          <p className="text-sm font-medium text-foreground leading-tight mb-1">{bloque.label || "Selección múltiple"}</p>
          <div className="flex flex-wrap gap-3 mt-1">
            {options.map((opt: any) => {
              const isChecked = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={readOnly}
                  onClick={() => {
                    if (readOnly || !onChange) return;
                    const next = isChecked
                      ? selected.filter((v: string) => v !== opt.value)
                      : [...selected, opt.value];
                    onChange(bloque.id, next);
                  }}
                  className={`flex items-center gap-1.5 ${!readOnly ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className={`h-4 w-4 border-2 rounded flex items-center justify-center ${
                    isChecked ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40'
                  }`}>
                    {isChecked && <span className="text-[10px]">✓</span>}
                  </div>
                  <span className="text-sm">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    case "select":
      return <FieldCell label={bloque.label || "Selección"} value={(answers[bloque.id] as string) || "—"} />;

    case "checkbox": {
      const checked = answers[bloque.id] as boolean | undefined;
      return (
        <div className="field-cell flex items-center gap-2">
          <button
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(bloque.id, !checked)}
            className={`h-4 w-4 border rounded flex items-center justify-center ${
              checked ? 'bg-primary border-primary text-primary-foreground' : ''
            } ${!readOnly ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {checked && <span className="text-[10px]">✓</span>}
          </button>
          <span className="text-sm">{bloque.label || "Opción"}</span>
        </div>
      );
    }

    case "auto_field": {
      const key = ("props" in bloque && (bloque as any).props?.key) as AutoFieldKey | undefined;
      const span = ("props" in bloque && (bloque as any).props?.span) || false;
      if (!key) return <FieldCell label={bloque.label || "Auto"} value="Sin clave" badge="Auto" span={span} />;

      if (FIRMA_KEYS.has(key)) {
        const base64 = resolveAutoFieldValue(key, ctx);
        const nameMap: Record<string, string | null> = {
          aprendiz_firma: ctx.persona ? `${ctx.persona.nombres} ${ctx.persona.apellidos}` : null,
          entrenador_firma: ctx.entrenador ? `${ctx.entrenador.nombres} ${ctx.entrenador.apellidos}` : null,
          supervisor_firma: ctx.supervisor ? `${ctx.supervisor.nombres} ${ctx.supervisor.apellidos}` : null,
        };
        return (
          <SignatureBox
            label={bloque.label || getAutoFieldLabel(key)}
            imageBase64={base64}
            name={nameMap[key] ?? undefined}
          />
        );
      }

      const resolved = resolveAutoFieldValue(key, ctx);
      return (
        <FieldCell
          label={bloque.label || getAutoFieldLabel(key)}
          value={resolved || "Sin dato"}
          badge="Auto"
          span={span}
        />
      );
    }

    case "signature_aprendiz":
      return (
        <SignatureBox
          label={bloque.label || "Firma del Aprendiz"}
          imageBase64={ctx.persona?.firma}
          name={ctx.persona ? `${ctx.persona.nombres} ${ctx.persona.apellidos}` : undefined}
        />
      );

    case "signature_entrenador_auto":
      return (
        <SignatureBox
          label={bloque.label || "Firma del Entrenador"}
          imageBase64={ctx.entrenador?.firmaBase64}
          name={ctx.entrenador ? `${ctx.entrenador.nombres} ${ctx.entrenador.apellidos}` : undefined}
        />
      );

    case "signature_supervisor_auto":
      return (
        <SignatureBox
          label={bloque.label || "Firma del Supervisor"}
          imageBase64={ctx.supervisor?.firmaBase64}
          name={ctx.supervisor ? `${ctx.supervisor.nombres} ${ctx.supervisor.apellidos}` : undefined}
        />
      );

    case "attendance_by_day": {
      // Calculate days inclusively from dates, fallback to stored duracionDias
      let days = ctx.curso?.duracionDias || 0;
      if (ctx.curso?.fechaInicio && ctx.curso?.fechaFin) {
        const dInicio = parseLocalDate(ctx.curso.fechaInicio) ?? new Date(ctx.curso.fechaInicio);
        const dFin = parseLocalDate(ctx.curso.fechaFin) ?? new Date(ctx.curso.fechaFin);
        const calc = differenceInCalendarDays(dFin, dInicio);
        if (calc >= 0) days = calc + 1;
      }
      if (days <= 0) {
        return (
          <div style={{ gridColumn: "span 2" }} className="mt-3">
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-2">{bloque.label || "Registro de Asistencia por Día"}</p>
            <p className="text-sm text-muted-foreground italic py-4 text-center">Sin fechas aún — asigne un curso con duración para generar la tabla de asistencia</p>
          </div>
        );
      }
      const startDate = ctx.curso?.fechaInicio ? (parseLocalDate(ctx.curso.fechaInicio) ?? new Date(ctx.curso.fechaInicio)) : new Date();
      const attendanceRows = Array.from({ length: days }, (_, i) => {
        const d = addDays(startDate, i);
        return format(d, "dd/MM/yyyy", { locale: es });
      });

      // Resolve inherited signature for attendance block
      const attProps = (bloque as any).props || {};
      const firmaMode = attProps.firmaMode || 'none';
      let attendanceFirmaBase64: string | null = null;

      // 1. Check answers snapshot (injected by procesarEventoFirmaCompletada)
      const answerData = answers[bloque.id] as { firmaHeredada?: string } | undefined;
      if (answerData?.firmaHeredada) {
        attendanceFirmaBase64 = answerData.firmaHeredada;
      }

      // 2. Fallback: resolve from firmasMatricula
      if (!attendanceFirmaBase64 && firmaMode !== 'none') {
        const tipoFirmante = attProps.tipoFirmante || 'aprendiz';
        const firmas = ctx.firmasMatricula || [];
        const eligible = firmas.filter(f => f.tipo === tipoFirmante && f.autorizaReutilizacion);
        if (attProps.formatoOrigenId) {
          const exact = eligible.find(f => f.formatoOrigenId === attProps.formatoOrigenId);
          if (exact) attendanceFirmaBase64 = exact.firmaBase64;
        }
        if (!attendanceFirmaBase64 && eligible.length > 0) {
          const sorted = eligible.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          attendanceFirmaBase64 = sorted[0].firmaBase64;
        }
      }

      return (
        <div style={{ gridColumn: "span 2" }} className="mt-3">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-2">{bloque.label || "Registro de Asistencia por Día"}</p>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1 px-2 font-semibold">Fecha</th>
                <th className="text-left py-1 px-2 font-semibold">Firma</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRows.map((fecha) => (
                <tr key={fecha} className="border-b border-border/50">
                  <td className="py-1 px-2">{fecha}</td>
                  <td className="py-1 px-2">
                    {attendanceFirmaBase64 ? (
                      <img src={attendanceFirmaBase64} alt="Firma" className="h-6 object-contain" />
                    ) : (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "health_consent":
      return (
        <BloqueHealthConsentRenderer
          bloque={bloque}
          answers={answers}
          onChange={onChange}
          readOnly={readOnly}
        />
      );

    case "data_authorization":
      return (
        <BloqueDataAuthorizationRenderer
          bloque={bloque}
          answers={answers}
          onChange={onChange}
          readOnly={readOnly}
        />
      );

    case "evaluation_quiz":
      return (
        <BloqueEvaluationQuizRenderer
          bloque={bloque}
          answers={answers}
          onChange={onChange}
          readOnly={readOnly}
        />
      );

    case "satisfaction_survey":
      return (
        <BloqueSatisfactionSurveyRenderer
          bloque={bloque}
          answers={answers}
          onChange={onChange}
          readOnly={readOnly}
        />
      );

    case "signature_capture":
      return (
        <SignatureCaptureBlock
          bloque={bloque as BloqueSignatureCapture}
          rc={rc}
        />
      );

    case "document_header": {
      const hp = (bloque as any).props || {};
      const fRef = rc.formatoRef;
      const fMeta = fRef?.documentMeta;
      return (
        <div style={{ gridColumn: "span 2" }}>
          <DocumentHeader
            nombreDocumento={bloque.label || fRef?.nombre || ""}
            codigo={hp.codigo || fRef?.codigo || ""}
            version={hp.version || fRef?.version || ""}
            fechaCreacion={hp.fechaCreacion || fMeta?.fechaCreacion || "—"}
            fechaEdicion={hp.fechaEdicion || fMeta?.fechaEdicion || "—"}
            empresaNombre={hp.empresaNombre}
            sistemaGestion={hp.sistemaGestion}
            subsistema={hp.subsistema || fMeta?.subsistema || "FORMACIÓN"}
            logoUrl={hp.logoUrl || undefined}
            borderColor={hp.borderColor || undefined}
          />
        </div>
      );
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Collapsible section — groups blocks until next section_title
// ---------------------------------------------------------------------------

function CollapsibleSection({ bloque, rc }: { bloque: Bloque; rc: RenderContext }) {
  const defaultOpen = ("props" in bloque && (bloque as any).props?.defaultOpen) !== false;
  const [open, setOpen] = useState(defaultOpen);

  // Find child blocks: all blocks between this section_title and the next one
  // This component renders just the header; children are rendered by the parent
  // using the grouping logic below. Here we only render the toggle header.
  return (
    <div style={{ gridColumn: "span 2" }} className="mt-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 border-b border-border pb-1 mb-2 cursor-pointer hover:bg-muted/30 transition-colors rounded-t px-1"
      >
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? '' : '-rotate-90'}`} />
        <h2 className="text-[10px] font-bold uppercase tracking-[0.1em] flex-1 text-left">
          {bloque.label || "Sección sin título"}
        </h2>
      </button>
      {!open && (
        <p className="text-xs text-muted-foreground italic px-1">Sección contraída — clic para expandir</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Visibility rule evaluation
// ---------------------------------------------------------------------------

function evaluateVisibilityRule(
  bloque: Bloque,
  answers: Record<string, unknown>
): boolean {
  const rule = (bloque as any).visibilityRule;
  if (!rule || !rule.field || !rule.operator) return true;

  const fieldValue = answers[rule.field];
  const ruleValue = rule.value;

  switch (rule.operator) {
    case 'equals':
      return fieldValue === ruleValue;
    case 'not_equals':
      return fieldValue !== ruleValue;
    case 'is_filled':
      return fieldValue != null && fieldValue !== '' && fieldValue !== false;
    case 'is_empty':
      return fieldValue == null || fieldValue === '' || fieldValue === false;
    default:
      return true;
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface DynamicFormatoDocumentProps {
  formato: FormatoFormacion;
  persona: Persona | null;
  matricula: Matricula;
  curso: Curso | null;
  entrenador: Personal | null;
  supervisor: Personal | null;
  nivelFormacionNombre?: string | null;
  answers?: Record<string, unknown>;
  onAnswerChange?: (key: string, value: unknown) => void;
  readOnly?: boolean;
  firmasMatricula?: FirmaMatricula[];
  respuestasPrevias?: FormatoRespuesta[];
  camposAdicionalesNivel?: { key: string; label: string; value?: string }[];
}

export default function DynamicFormatoDocument({
  formato,
  persona,
  matricula,
  curso,
  entrenador,
  supervisor,
  nivelFormacionNombre,
  answers = {},
  onAnswerChange,
  readOnly = true,
  firmasMatricula,
  respuestasPrevias,
  camposAdicionalesNivel,
}: DynamicFormatoDocumentProps) {
  const meta = formato.documentMeta;
  const bloques = formato.bloques || [];

  // Seed default values from option blocks on first render
  useEffect(() => {
    if (readOnly || !onAnswerChange) return;
    bloques.forEach((b: any) => {
      if (answers[b.id] !== undefined) return;
      const options = b.props?.options as { value: string; default?: boolean }[] | undefined;
      if (!options) return;
      if (b.type === 'radio' || b.type === 'select') {
        const def = options.find((o) => o.default);
        if (def) onAnswerChange(b.id, def.value);
      } else if (b.type === 'multi_choice') {
        const defs = options.filter((o) => o.default).map((o) => o.value);
        if (defs.length > 0) onAnswerChange(b.id, defs);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formato.id]);

  const ctx: AutoFieldContext = {
    persona, matricula, curso, entrenador, supervisor, nivelFormacionNombre,
    firmasMatricula,
    respuestasPrevias,
    camposAdicionalesNivel,
  };
  const rc: RenderContext = {
    ctx, answers, onChange: onAnswerChange, readOnly,
    formatoRef: { nombre: formato.nombre, codigo: formato.codigo, version: formato.version, documentMeta: meta },
  };

  const hasHeaderBlock = bloques.some((b: any) => b.type === 'document_header');

  return (
    <div className="bg-white p-6" style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "12px" }}>
      {!hasHeaderBlock && (
        <DocumentHeader
          nombreDocumento={formato.nombre}
          codigo={formato.codigo}
          version={formato.version}
          fechaCreacion={meta?.fechaCreacion || "—"}
          fechaEdicion={meta?.fechaEdicion || "—"}
          subsistema={meta?.subsistema || "FORMACIÓN"}
        />
      )}

      {bloques.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4" style={{ fontSize: "12px" }}>
          {bloques.map((bloque) => {
            // Conditional visibility
            if (!evaluateVisibilityRule(bloque, answers)) return null;
            return (
              <React.Fragment key={bloque.id}>
                {renderBloque(bloque, rc)}
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Sin bloques configurados</p>
        </div>
      )}
    </div>
  );
}
