import React, { useEffect, useCallback, useMemo } from "react";
import DOMPurify from "dompurify";
import { Info, FileText, ClipboardCheck, ShieldCheck, Heart, PenTool, BarChart3, CalendarDays } from "lucide-react";
import PortalSectionCard from "./PortalSectionCard";
import PortalSignatureCapture from "./PortalSignatureCapture";
import { getAutoFieldLabel } from "@/data/autoFieldCatalog";
import { resolveAutoFieldValue, AutoFieldContext } from "@/utils/resolveAutoField";
import type {
  FormatoFormacion,
  Bloque,
  AutoFieldKey,
  FirmaMatricula,
  BloqueSignatureCapture,
  BloqueHealthConsent,
  BloqueDataAuthorization,
  BloqueEvaluationQuiz,
  BloqueSatisfactionSurvey,
} from "@/types/formatoFormacion";
import type { Row2Block } from "@/stores/useFormatoEditorStore";
import type { Persona } from "@/types/persona";
import type { Matricula } from "@/types/matricula";
import type { Curso } from "@/types/curso";
import BloqueHealthConsentRenderer from "@/components/matriculas/formatos/bloques/BloqueHealthConsentRenderer";
import BloqueDataAuthorizationRenderer from "@/components/matriculas/formatos/bloques/BloqueDataAuthorizationRenderer";
import BloqueEvaluationQuizRenderer from "@/components/matriculas/formatos/bloques/BloqueEvaluationQuizRenderer";
import BloqueSatisfactionSurveyRenderer from "@/components/matriculas/formatos/bloques/BloqueSatisfactionSurveyRenderer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SectionKind = "info" | "input" | "authorization" | "health" | "evaluation" | "survey" | "signature" | "attendance";

interface SemanticSection {
  kind: SectionKind;
  title: string;
  bloques: Bloque[];
}

interface SignatureProps {
  autorizaReutilizacion: boolean;
  onAutorizaReutilizacionChange: (v: boolean) => void;
}

interface PortalFormatoRendererProps {
  formato: FormatoFormacion;
  persona: Persona | null;
  matricula: Matricula;
  curso: Curso | null;
  answers: Record<string, unknown>;
  onAnswerChange?: (key: string, value: unknown) => void;
  readOnly?: boolean;
  firmasMatricula?: FirmaMatricula[];
  signatureProps?: SignatureProps;
}

// ---------------------------------------------------------------------------
// Block classification
// ---------------------------------------------------------------------------

const HIDDEN_TYPES = new Set(["document_header", "divider"]);
const INFO_TYPES = new Set(["auto_field", "paragraph", "heading"]);
const INPUT_TYPES = new Set(["text", "textarea", "email", "date", "number", "radio", "select", "multi_choice", "checkbox", "file"]);

function classifyBlock(bloque: Bloque): SectionKind | "hidden" | "section_title" {
  const type = (bloque as any).type as string;
  if (HIDDEN_TYPES.has(type)) return "hidden";
  if (type === "section_title") return "section_title";
  if (INFO_TYPES.has(type)) return "info";
  if (INPUT_TYPES.has(type)) return "input";
  if (type === "health_consent") return "health";
  if (type === "data_authorization") return "authorization";
  if (type === "evaluation_quiz") return "evaluation";
  if (type === "satisfaction_survey") return "survey";
  if (type === "signature_capture" || type === "signature_aprendiz") return "signature";
  if (type === "attendance_by_day") return "attendance";
  // row2 — classify by children
  if (type === "row2") return "input";
  return "input";
}

function groupBlocksIntoSections(bloques: Bloque[]): SemanticSection[] {
  const sections: SemanticSection[] = [];
  let currentTitle: string | null = null;
  let currentKind: SectionKind | null = null;
  let currentBloques: Bloque[] = [];

  const flush = () => {
    if (currentBloques.length > 0 && currentKind) {
      sections.push({
        kind: currentKind,
        title: currentTitle || getDefaultTitle(currentKind),
        bloques: [...currentBloques],
      });
    }
    currentBloques = [];
    currentKind = null;
    currentTitle = null;
  };

  for (const bloque of bloques) {
    const classification = classifyBlock(bloque);
    if (classification === "hidden") continue;

    if (classification === "section_title") {
      flush();
      currentTitle = bloque.label || null;
      continue;
    }

    const kind = classification as SectionKind;

    // Specialized blocks always get their own section
    if (["health", "authorization", "evaluation", "survey", "signature", "attendance"].includes(kind)) {
      flush();
      sections.push({
        kind,
        title: currentTitle || bloque.label || getDefaultTitle(kind),
        bloques: [bloque],
      });
      currentTitle = null;
      continue;
    }

    // Group consecutive info or input blocks
    if (currentKind && currentKind !== kind) {
      flush();
    }

    if (!currentKind) {
      currentKind = kind;
      if (!currentTitle) currentTitle = getDefaultTitle(kind);
    }
    currentBloques.push(bloque);
  }
  flush();
  return sections;
}

function getDefaultTitle(kind: SectionKind): string {
  switch (kind) {
    case "info": return "Información del estudiante";
    case "input": return "Campos a diligenciar";
    case "authorization": return "Autorización de datos";
    case "health": return "Consentimiento de salud";
    case "evaluation": return "Evaluación";
    case "survey": return "Encuesta de satisfacción";
    case "signature": return "Firma";
    case "attendance": return "Registro de asistencia";
    default: return "Sección";
  }
}

const SECTION_ICONS: Record<SectionKind, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-muted-foreground" />,
  input: <FileText className="h-4 w-4 text-muted-foreground" />,
  authorization: <ShieldCheck className="h-4 w-4 text-muted-foreground" />,
  health: <Heart className="h-4 w-4 text-muted-foreground" />,
  evaluation: <ClipboardCheck className="h-4 w-4 text-muted-foreground" />,
  survey: <BarChart3 className="h-4 w-4 text-muted-foreground" />,
  signature: <PenTool className="h-4 w-4 text-muted-foreground" />,
  attendance: <CalendarDays className="h-4 w-4 text-muted-foreground" />,
};

// ---------------------------------------------------------------------------
// Visibility rule evaluation
// ---------------------------------------------------------------------------

function evaluateVisibility(bloque: Bloque, answers: Record<string, unknown>): boolean {
  const rule = (bloque as any).visibilityRule;
  if (!rule || !rule.field || !rule.operator) return true;
  const val = answers[rule.field];
  switch (rule.operator) {
    case "equals": return val === rule.value;
    case "not_equals": return val !== rule.value;
    case "is_filled": return val != null && val !== "" && val !== false;
    case "is_empty": return val == null || val === "" || val === false;
    default: return true;
  }
}

// ---------------------------------------------------------------------------
// Section status helpers
// ---------------------------------------------------------------------------

function getSectionStatus(
  section: SemanticSection,
  answers: Record<string, unknown>
): "complete" | "incomplete" | "info" {
  if (section.kind === "info") return "info";

  const requiredIds = section.bloques
    .filter((b) => b.required !== false)
    .map((b) => b.id);

  if (requiredIds.length === 0) {
    // Check if any answer exists for any block in section
    const hasAny = section.bloques.some((b) => {
      const v = answers[b.id];
      return v != null && v !== "" && v !== false;
    });
    return hasAny ? "complete" : "incomplete";
  }

  const allFilled = requiredIds.every((id) => {
    const v = answers[id];
    return v != null && v !== "" && v !== false;
  });
  return allFilled ? "complete" : "incomplete";
}

// ---------------------------------------------------------------------------
// Individual block renderers (portal-optimized)
// ---------------------------------------------------------------------------

function PortalInfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-[60%]">
        {value || "—"}
      </span>
    </div>
  );
}

function PortalTextField({
  label,
  value,
  onChange,
  type = "text",
  readOnly,
  required,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  readOnly?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        disabled={readOnly}
      />
    </div>
  );
}

function PortalRadioField({
  label,
  options,
  value,
  onChange,
  readOnly,
  required,
}: {
  label: string;
  options: { label: string; value: string }[];
  value?: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <div className="space-y-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(opt.value)}
            className="flex items-center gap-2 w-full text-left py-1"
          >
            <div
              className={`h-4 w-4 rounded-full border-2 shrink-0 ${
                value === opt.value
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/40"
              }`}
            />
            <span className="text-sm text-foreground">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PortalMultiChoiceField({
  label,
  options,
  value,
  onChange,
  readOnly,
  required,
}: {
  label: string;
  options: { label: string; value: string }[];
  value: string[];
  onChange?: (v: string[]) => void;
  readOnly?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <div className="space-y-1.5">
        {options.map((opt) => {
          const checked = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              disabled={readOnly}
              onClick={() => {
                if (readOnly || !onChange) return;
                onChange(
                  checked
                    ? value.filter((v) => v !== opt.value)
                    : [...value, opt.value]
                );
              }}
              className="flex items-center gap-2 w-full text-left py-1"
            >
              <div
                className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${
                  checked
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/40"
                }`}
              >
                {checked && <span className="text-[10px]">✓</span>}
              </div>
              <span className="text-sm text-foreground">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PortalCheckboxField({
  label,
  description,
  checked,
  onChange,
  readOnly,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  readOnly?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={readOnly}
      onClick={() => !readOnly && onChange?.(!checked)}
      className="flex items-start gap-3 w-full text-left py-2"
    >
      <div
        className={`h-5 w-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 ${
          checked
            ? "bg-primary border-primary text-primary-foreground"
            : "border-muted-foreground/40"
        }`}
      >
        {checked && <span className="text-xs">✓</span>}
      </div>
      <div>
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Block renderer (portal mode)
// ---------------------------------------------------------------------------

function renderPortalBlock(
  bloque: Bloque,
  ctx: AutoFieldContext,
  answers: Record<string, unknown>,
  onChange?: (key: string, value: unknown) => void,
  readOnly?: boolean
): React.ReactNode {
  if (!evaluateVisibility(bloque, answers)) return null;

  const type = (bloque as any).type as string;

  // Row2
  if (type === "row2") {
    const row = bloque as unknown as Row2Block;
    return (
      <div className="grid grid-cols-2 gap-3" key={bloque.id}>
        <div>{row.cols[0] ? renderPortalBlock(row.cols[0], ctx, answers, onChange, readOnly) : null}</div>
        <div>{row.cols[1] ? renderPortalBlock(row.cols[1], ctx, answers, onChange, readOnly) : null}</div>
      </div>
    );
  }

  switch (bloque.type) {
    case "auto_field": {
      const key = ((bloque as any).props?.key) as AutoFieldKey | undefined;
      if (!key) return null;
      const resolved = resolveAutoFieldValue(key, ctx);
      return (
        <PortalInfoField
          key={bloque.id}
          label={bloque.label || getAutoFieldLabel(key)}
          value={resolved || "—"}
        />
      );
    }

    case "heading":
      return (
        <p key={bloque.id} className="text-sm font-semibold text-foreground pt-1">
          {bloque.label}
        </p>
      );

    case "paragraph": {
      const rawHtml = ((bloque as any).props?.text) || "";
      const isHtml = /<[a-z][\s\S]*>/i.test(rawHtml);
      return isHtml ? (
        <div
          key={bloque.id}
          className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawHtml) }}
        />
      ) : (
        <p key={bloque.id} className="text-sm text-muted-foreground leading-relaxed">
          {rawHtml}
        </p>
      );
    }

    case "text":
    case "textarea":
    case "email":
      return (
        <PortalTextField
          key={bloque.id}
          label={bloque.label || "Campo"}
          value={(answers[bloque.id] as string) || ""}
          onChange={onChange ? (v) => onChange(bloque.id, v) : undefined}
          type={bloque.type === "email" ? "email" : "text"}
          readOnly={readOnly}
          required={bloque.required}
        />
      );

    case "date":
      return (
        <PortalTextField
          key={bloque.id}
          label={bloque.label || "Fecha"}
          value={(answers[bloque.id] as string) || ""}
          onChange={onChange ? (v) => onChange(bloque.id, v) : undefined}
          type="date"
          readOnly={readOnly}
          required={bloque.required}
        />
      );

    case "number":
      return (
        <PortalTextField
          key={bloque.id}
          label={bloque.label || "Número"}
          value={(answers[bloque.id] as string) || ""}
          onChange={onChange ? (v) => onChange(bloque.id, v) : undefined}
          type="number"
          readOnly={readOnly}
          required={bloque.required}
        />
      );

    case "radio": {
      const options = ((bloque as any).props?.options) || [];
      return (
        <PortalRadioField
          key={bloque.id}
          label={bloque.label || "Selección"}
          options={options}
          value={answers[bloque.id] as string | undefined}
          onChange={onChange ? (v) => onChange(bloque.id, v) : undefined}
          readOnly={readOnly}
          required={bloque.required}
        />
      );
    }

    case "multi_choice": {
      const options = ((bloque as any).props?.options) || [];
      return (
        <PortalMultiChoiceField
          key={bloque.id}
          label={bloque.label || "Selección múltiple"}
          options={options}
          value={(answers[bloque.id] as string[]) || []}
          onChange={onChange ? (v) => onChange(bloque.id, v) : undefined}
          readOnly={readOnly}
          required={bloque.required}
        />
      );
    }

    case "select": {
      const options = ((bloque as any).props?.options) || [];
      return (
        <div key={bloque.id} className="space-y-1">
          <label className="text-sm font-medium text-foreground">
            {bloque.label || "Selección"}
            {bloque.required && <span className="text-destructive ml-0.5">*</span>}
          </label>
          <select
            value={(answers[bloque.id] as string) || ""}
            onChange={(e) => onChange?.(bloque.id, e.target.value)}
            disabled={readOnly}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Seleccionar...</option>
            {options.map((opt: any) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );
    }

    case "checkbox": {
      const props = (bloque as any).props || {};
      return (
        <PortalCheckboxField
          key={bloque.id}
          label={bloque.label || "Opción"}
          description={props.description}
          checked={!!answers[bloque.id]}
          onChange={onChange ? (v) => onChange(bloque.id, v) : undefined}
          readOnly={readOnly}
        />
      );
    }

    case "health_consent":
      return (
        <BloqueHealthConsentRenderer
          key={bloque.id}
          bloque={bloque as BloqueHealthConsent}
          answers={answers}
          onChange={onChange}
          readOnly={readOnly}
        />
      );

    case "data_authorization":
      return (
        <BloqueDataAuthorizationRenderer
          key={bloque.id}
          bloque={bloque as BloqueDataAuthorization}
          answers={answers}
          onChange={onChange}
          readOnly={readOnly}
        />
      );

    case "evaluation_quiz":
      return (
        <BloqueEvaluationQuizRenderer
          key={bloque.id}
          bloque={bloque as BloqueEvaluationQuiz}
          answers={answers}
          onChange={onChange}
          readOnly={readOnly}
        />
      );

    case "satisfaction_survey":
      return (
        <BloqueSatisfactionSurveyRenderer
          key={bloque.id}
          bloque={bloque as BloqueSatisfactionSurvey}
          answers={answers}
          onChange={onChange}
          readOnly={readOnly}
        />
      );

    // signature_capture is rendered by the section renderer, not here
    case "signature_capture":
    case "signature_aprendiz":
      return null;

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PortalFormatoRenderer({
  formato,
  persona,
  matricula,
  curso,
  answers,
  onAnswerChange,
  readOnly = false,
  firmasMatricula,
}: PortalFormatoRendererProps) {
  const bloques = formato.bloques || [];

  // Seed defaults on mount
  useEffect(() => {
    if (readOnly || !onAnswerChange) return;
    bloques.forEach((b: any) => {
      if (answers[b.id] !== undefined) return;
      const options = b.props?.options as { value: string; default?: boolean }[] | undefined;
      if (!options) return;
      if (b.type === "radio" || b.type === "select") {
        const def = options.find((o) => o.default);
        if (def) onAnswerChange(b.id, def.value);
      } else if (b.type === "multi_choice") {
        const defs = options.filter((o) => o.default).map((o) => o.value);
        if (defs.length > 0) onAnswerChange(b.id, defs);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formato.id]);

  const ctx: AutoFieldContext = {
    persona,
    matricula,
    curso,
    entrenador: null,
    supervisor: null,
    firmasMatricula,
  };

  const sections = useMemo(() => groupBlocksIntoSections(bloques), [bloques]);

  return (
    <div className="space-y-3">
      {sections.map((section, idx) => {
        const status = getSectionStatus(section, answers);
        const isInfoSection = section.kind === "info";

        return (
          <PortalSectionCard
            key={`${section.kind}-${idx}`}
            title={section.title}
            icon={SECTION_ICONS[section.kind]}
            status={status}
            defaultOpen={!isInfoSection}
          >
            {isInfoSection ? (
              <div className="divide-y divide-border/50">
                {section.bloques.map((bloque) => (
                  <React.Fragment key={bloque.id}>
                    {renderPortalBlock(bloque, ctx, answers, onAnswerChange, true)}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {section.bloques.map((bloque) => (
                  <React.Fragment key={bloque.id}>
                    {renderPortalBlock(bloque, ctx, answers, onAnswerChange, readOnly)}
                  </React.Fragment>
                ))}
              </div>
            )}
          </PortalSectionCard>
        );
      })}
    </div>
  );
}
