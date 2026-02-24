import React from "react";
import DocumentHeader from "@/components/shared/DocumentHeader";
import { Badge } from "@/components/ui/badge";
import { getAutoFieldLabel } from "@/data/autoFieldCatalog";
import { BLOQUE_TYPE_LABELS } from "@/data/bloqueConstants";
import { resolveAutoFieldValue, AutoFieldContext } from "@/utils/resolveAutoField";
import type { FormatoFormacion, Bloque, AutoFieldKey } from "@/types/formatoFormacion";
import type { Persona } from "@/types/persona";
import type { Matricula } from "@/types/matricula";
import type { Curso } from "@/types/curso";
import type { Personal } from "@/types/personal";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

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
// Block renderer
// ---------------------------------------------------------------------------

const FIRMA_KEYS = new Set<string>(["aprendiz_firma", "entrenador_firma", "supervisor_firma"]);

function renderBloque(bloque: Bloque, ctx: AutoFieldContext): React.ReactNode {
  switch (bloque.type) {
    case "section_title":
      return (
        <div className="field-span" style={{ gridColumn: "span 2" }}>
          <div className="section-title flex items-center gap-2 border-b border-border pb-1 mt-5 mb-3">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.1em]">
              {bloque.label || "Sección sin título"}
            </h2>
          </div>
        </div>
      );

    case "heading": {
      const level = ("props" in bloque && (bloque as any).props?.level) || 2;
      const sizeClass = level === 1 ? "text-lg" : level === 2 ? "text-base" : "text-sm";
      return (
        <div style={{ gridColumn: "span 2" }}>
          <h3 className={`${sizeClass} font-bold mt-3`}>{bloque.label || "Encabezado"}</h3>
        </div>
      );
    }

    case "paragraph":
      return (
        <div style={{ gridColumn: "span 2" }}>
          <p className="text-sm leading-relaxed text-justify">
            {("props" in bloque && (bloque as any).props?.text) || ""}
          </p>
        </div>
      );

    case "text":
      return <FieldCell label={bloque.label || "Campo de texto"} value="—" />;

    case "date":
      return <FieldCell label={bloque.label || "Fecha"} value="—" />;

    case "number":
      return <FieldCell label={bloque.label || "Número"} value="—" />;

    case "radio": {
      const options = ("props" in bloque && (bloque as any).props?.options) || [];
      return (
        <div className="field-cell">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground leading-tight">{bloque.label || "Selección"}</p>
          <div className="flex gap-3 mt-1">
            {options.map((opt: any) => (
              <div key={opt.value} className="flex items-center gap-1">
                <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40" />
                <span className="text-xs">{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "select":
      return <FieldCell label={bloque.label || "Selección"} value="—" />;

    case "checkbox":
      return (
        <div className="field-cell flex items-center gap-2">
          <div className="h-4 w-4 border rounded" />
          <span className="text-sm">{bloque.label || "Opción"}</span>
        </div>
      );

    case "auto_field": {
      const key = ("props" in bloque && (bloque as any).props?.key) as AutoFieldKey | undefined;
      const span = ("props" in bloque && (bloque as any).props?.span) || false;
      if (!key) return <FieldCell label={bloque.label || "Auto"} value="Sin clave" badge="Auto" span={span} />;

      // Signature fields render as images
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
      const days = ctx.curso?.duracionDias || 1;
      const startDate = ctx.curso?.fechaInicio ? new Date(ctx.curso.fechaInicio) : new Date();
      const rows = Array.from({ length: days }, (_, i) => {
        const d = addDays(startDate, i);
        return format(d, "dd/MM/yyyy", { locale: es });
      });
      return (
        <div style={{ gridColumn: "span 2" }} className="mt-3">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-2">{bloque.label || "Registro de Asistencia por Día"}</p>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1 px-2 font-semibold">Fecha</th>
                <th className="text-left py-1 px-2 font-semibold">Hora entrada</th>
                <th className="text-left py-1 px-2 font-semibold">Hora salida</th>
                <th className="text-left py-1 px-2 font-semibold">Firma</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((fecha) => (
                <tr key={fecha} className="border-b border-border/50">
                  <td className="py-1 px-2">{fecha}</td>
                  <td className="py-1 px-2">—</td>
                  <td className="py-1 px-2">—</td>
                  <td className="py-1 px-2 text-muted-foreground italic">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "health_consent":
    case "data_authorization":
    case "evaluation_quiz":
    case "satisfaction_survey":
      return (
        <div style={{ gridColumn: "span 2" }} className="border rounded-lg p-3 bg-muted/20 mt-2">
          <Badge variant="secondary" className="text-[10px]">
            {BLOQUE_TYPE_LABELS[bloque.type]}
          </Badge>
          <p className="text-xs text-muted-foreground mt-1">
            Bloque complejo — se renderiza con su componente especializado
          </p>
        </div>
      );

    default:
      return null;
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
}

export default function DynamicFormatoDocument({
  formato,
  persona,
  matricula,
  curso,
  entrenador,
  supervisor,
}: DynamicFormatoDocumentProps) {
  const meta = formato.documentMeta;
  const bloques = formato.bloques || [];
  const ctx: AutoFieldContext = { persona, matricula, curso, entrenador, supervisor };

  return (
    <div className="bg-white p-6" style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "12px" }}>
      <DocumentHeader
        nombreDocumento={formato.nombre}
        codigo={formato.codigo}
        version={formato.version}
        fechaCreacion={meta?.fechaCreacion || "—"}
        fechaEdicion={meta?.fechaEdicion || "—"}
        subsistema={meta?.subsistema || "FORMACIÓN"}
      />

      {bloques.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4" style={{ fontSize: "12px" }}>
          {bloques.map((bloque) => (
            <React.Fragment key={bloque.id}>
              {renderBloque(bloque, ctx)}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Sin bloques configurados</p>
        </div>
      )}
    </div>
  );
}
