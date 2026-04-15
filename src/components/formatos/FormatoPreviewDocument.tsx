import DocumentHeader from "@/components/shared/DocumentHeader";
import { Badge } from "@/components/ui/badge";
import { getAutoFieldLabel } from "@/data/autoFieldCatalog";
import { BLOQUE_TYPE_LABELS } from "@/data/bloqueConstants";
import type { FormatoFormacion, Bloque } from "@/types/formatoFormacion";
import type { Row2Block, Row1Block } from "@/stores/useFormatoEditorStore";
import DOMPurify from "dompurify";

// ---------------------------------------------------------------------------
// Dummy data for preview
// ---------------------------------------------------------------------------

const DUMMY_AUTO_VALUES: Record<string, string> = {
  nombre_aprendiz: "Juan Carlos Pérez Martínez",
  documento_aprendiz: "1.023.456.789",
  tipo_documento_aprendiz: "Cédula de Ciudadanía",
  genero_aprendiz: "Masculino",
  fecha_nacimiento_aprendiz: "15/03/1990",
  pais_nacimiento_aprendiz: "Colombia",
  nivel_educativo_aprendiz: "Tecnólogo",
  rh_aprendiz: "O+",
  telefono_aprendiz: "310-456-7890",
  email_aprendiz: "juan.perez@email.com",
  contacto_emergencia_nombre: "María Pérez",
  contacto_emergencia_telefono: "311-789-0123",
  empresa_nombre: "Construcciones ABC S.A.S.",
  empresa_cargo: "Operario",
  nivel_formacion: "Trabajo Seguro en Alturas - Avanzado",
  empresa_nivel_formacion: "Trabajo Seguro en Alturas - Avanzado",
  empresa_nit: "900.123.456-7",
  empresa_representante_legal: "Pedro Gómez López",
  area_trabajo: "Construcción",
  sector_economico: "Construcción",
  tipo_vinculacion: "Contrato obra",
  eps_aprendiz: "Sura EPS",
  arl_aprendiz: "Sura ARL",
  nivel_previo: "Básico",
  centro_formacion_previo: "Centro de Formación XYZ",
  consentimiento_salud: "Sí",
  restriccion_medica: "No",
  restriccion_medica_detalle: "",
  alergias: "Sí",
  alergias_detalle: "Penicilina",
  consumo_medicamentos: "No",
  consumo_medicamentos_detalle: "",
  embarazo: "No",
  nombre_curso: "Trabajo Seguro en Alturas - Nivel Avanzado",
  tipo_formacion_curso: "Formación",
  numero_curso: "2025-001",
  fecha_inicio_curso: "15/01/2025",
  fecha_fin_curso: "20/01/2025",
  duracion_dias_curso: "6",
  horas_totales_curso: "48",
  entrenador_nombre: "Carlos Rodríguez",
  supervisor_nombre: "Ana Martínez",
  fecha_diligenciamiento: "24/02/2026",
  aprendiz_firma: "(Firma)",
  entrenador_firma: "(Firma)",
  supervisor_firma: "(Firma)",
};

const ATTENDANCE_DAYS = [
  { fecha: "15/01/2025", entrada: "07:00", salida: "17:00" },
  { fecha: "16/01/2025", entrada: "07:00", salida: "17:00" },
  { fecha: "17/01/2025", entrada: "07:00", salida: "17:00" },
  { fecha: "18/01/2025", entrada: "07:00", salida: "17:00" },
  { fecha: "19/01/2025", entrada: "07:00", salida: "17:00" },
  { fecha: "20/01/2025", entrada: "07:00", salida: "17:00" },
];

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

// ---------------------------------------------------------------------------
// Block renderers
// ---------------------------------------------------------------------------

function renderBloque(bloque: Bloque): React.ReactNode {
  // Handle row1 before switch
  if ((bloque as any).type === 'row1') {
    const row = bloque as unknown as Row1Block;
    return (
      <div style={{ gridColumn: "span 2" }}>
        {row.col.map((child) => (
          <React.Fragment key={child.id}>{renderBloque(child)}</React.Fragment>
        ))}
      </div>
    );
  }

  // Handle row2 before switch (type not in Bloque union)
  if ((bloque as any).type === 'row2') {
    const row = bloque as unknown as Row2Block;
    return (
      <div style={{ gridColumn: "span 2" }} className="grid grid-cols-2 gap-x-6 gap-y-2">
        <div>{row.cols[0].map((child) => <React.Fragment key={child.id}>{renderBloque(child)}</React.Fragment>)}</div>
        <div>{row.cols[1].map((child) => <React.Fragment key={child.id}>{renderBloque(child)}</React.Fragment>)}</div>
      </div>
    );
  }

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

    case "paragraph": {
      const rawHtml = ("props" in bloque && (bloque as any).props?.text) || "";
      const isHtml = /<[a-z][\s\S]*>/i.test(rawHtml);
      return (
        <div style={{ gridColumn: "span 2" }}>
          {isHtml ? (
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawHtml) }}
            />
          ) : (
            <p className="text-sm leading-relaxed text-justify">
              {rawHtml || "Texto del párrafo..."}
            </p>
          )}
        </div>
      );
    }

    case "text":
      return <FieldCell label={bloque.label || "Campo de texto"} value="Dato de ejemplo" />;

    case "textarea":
      return <FieldCell label={bloque.label || "Texto largo"} value="Texto de ejemplo..." />;

    case "email":
      return <FieldCell label={bloque.label || "Correo"} value="correo@ejemplo.com" />;

    case "date":
      return <FieldCell label={bloque.label || "Fecha"} value="15/01/2025" />;

    case "number":
      return <FieldCell label={bloque.label || "Número"} value="42" />;

    case "divider":
      return (
        <div style={{ gridColumn: "span 2" }}>
          <hr className="border-t-2 border-muted my-2" />
        </div>
      );

    case "file":
      return <FieldCell label={bloque.label || "Archivo adjunto"} value={`[Adjuntar: ${(bloque as any).props?.accept || '*'}]`} />;

    case "radio": {
      const options = ("props" in bloque && (bloque as any).props?.options) || [];
      const firstLabel = options[0]?.label || "Opción";
      return (
        <div className="field-cell">
          <p className="text-sm font-medium text-foreground leading-tight mb-1">{bloque.label || "Selección"}</p>
          <div className="flex gap-3 mt-1">
            {options.map((opt: any, i: number) => (
              <div key={opt.value} className="flex items-center gap-1">
                <div className={`h-3.5 w-3.5 rounded-full border ${i === 0 ? "bg-foreground border-foreground" : "border-muted-foreground/40"}`} />
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "select": {
      const options = ("props" in bloque && (bloque as any).props?.options) || [];
      return <FieldCell label={bloque.label || "Selección"} value={options[0]?.label || "Opción seleccionada"} />;
    }

    case "checkbox":
      return (
        <div className="field-cell flex items-center gap-2">
          <div className="h-4 w-4 border rounded bg-foreground flex items-center justify-center">
            <svg className="h-3 w-3 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm">{bloque.label || "Opción"}</span>
        </div>
      );

    case "multi_choice": {
      const mcOptions = ("props" in bloque && (bloque as any).props?.options) || [];
      return (
        <div className="field-cell">
          <p className="text-sm font-medium text-foreground leading-tight mb-1">{bloque.label || "Selección múltiple"}</p>
          <div className="flex flex-wrap gap-3 mt-1">
            {mcOptions.map((opt: any, i: number) => (
              <div key={opt.value} className="flex items-center gap-1">
                <div className={`h-3.5 w-3.5 border rounded-sm ${i === 0 ? "bg-foreground border-foreground" : "border-muted-foreground/40"}`}>
                  {i === 0 && (
                    <svg className="h-3.5 w-3.5 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "auto_field": {
      const key = ("props" in bloque && (bloque as any).props?.key) || "";
      const span = ("props" in bloque && (bloque as any).props?.span) || false;
      const resolvedValue = DUMMY_AUTO_VALUES[key] || `[${getAutoFieldLabel(key)}]`;
      return (
        <FieldCell
          label={bloque.label || getAutoFieldLabel(key)}
          value={resolvedValue}
          span={span}
        />
      );
    }

    case "signature_capture": {
      const scProps = (bloque as any).props || {};
      const mode = scProps.mode || 'capture';
      const tipoFirmante = scProps.tipoFirmante || 'aprendiz';
      const firmanteLabel = tipoFirmante === 'aprendiz' ? 'Aprendiz' : tipoFirmante === 'entrenador' ? 'Entrenador' : 'Supervisor';
      const modeLabel = mode === 'capture' ? 'Captura nueva' : mode === 'reuse_if_available' ? 'Reutilizar si disponible' : mode === 'reuse_required' ? 'Solo reutilizar' : 'Solo mostrar';
      return (
        <div style={{ gridColumn: "span 2" }} className="mt-4">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-2">{bloque.label || `Firma — ${firmanteLabel}`}</p>
          <div className="border-2 border-dashed border-muted rounded h-24 flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground italic">Firma del {firmanteLabel}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">{modeLabel}</p>
          </div>
        </div>
      );
    }

    case "attendance_by_day":
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
              {ATTENDANCE_DAYS.map((day) => (
                <tr key={day.fecha} className="border-b border-border/50">
                  <td className="py-1 px-2">{day.fecha}</td>
                  <td className="py-1 px-2 text-muted-foreground italic">Firma</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "evaluation_quiz": {
      const quizProps = (bloque as any).props || {};
      const preguntas = quizProps.preguntas || [];
      const umbral = quizProps.umbralAprobacion || 70;
      return (
        <div style={{ gridColumn: "span 2" }} className="mt-3">
          <div className="section-title flex items-center gap-2 border-b border-border pb-1 mb-3">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.1em]">
              {bloque.label || "Evaluación de Conocimientos"}
            </h2>
            <Badge variant="secondary" className="text-[9px]">Umbral: {umbral}%</Badge>
          </div>
          {preguntas.length > 0 ? (
            <div className="space-y-3">
              {preguntas.map((p: any, idx: number) => (
                <div key={p.id ?? idx} className="border rounded p-2">
                  <p className="text-xs font-semibold mb-1">{idx + 1}. {p.texto || "Pregunta sin texto"}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {(p.opciones || []).map((opt: string, oi: number) => (
                      <div key={oi} className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded-full border border-muted-foreground/40 shrink-0" />
                        <span className="text-xs">{opt || `Opción ${oi + 1}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Sin preguntas configuradas</p>
          )}
        </div>
      );
    }

    case "satisfaction_survey": {
      const surveyProps = (bloque as any).props || {};
      const escalaPreguntas = surveyProps.escalaPreguntas || [];
      const escalaOpciones = surveyProps.escalaOpciones || [];
      const preguntaSiNo = surveyProps.preguntaSiNo;
      return (
        <div style={{ gridColumn: "span 2" }} className="mt-3">
          <div className="section-title flex items-center gap-2 border-b border-border pb-1 mb-3">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.1em]">
              {bloque.label || "Encuesta de Satisfacción"}
            </h2>
          </div>
          {escalaPreguntas.length > 0 ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 px-2 font-semibold">Aspecto a evaluar</th>
                  {escalaOpciones.map((opt: any) => (
                    <th key={opt.value} className="text-center py-1 px-2 font-semibold text-[10px]">{opt.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {escalaPreguntas.map((pregunta: string, idx: number) => (
                  <tr key={idx} className="border-b border-border/50">
                    <td className="py-1.5 px-2">{pregunta || `Pregunta ${idx + 1}`}</td>
                    {escalaOpciones.map((opt: any) => (
                      <td key={opt.value} className="text-center py-1.5 px-2">
                        <div className="h-3 w-3 rounded-full border border-muted-foreground/40 mx-auto" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-muted-foreground italic">Sin preguntas configuradas</p>
          )}
          {preguntaSiNo && (
            <div className="mt-3 border rounded p-2">
              <p className="text-xs font-medium">{preguntaSiNo}</p>
              <div className="flex gap-4 mt-1">
                <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full border border-muted-foreground/40" /><span className="text-xs">Sí</span></div>
                <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full border border-muted-foreground/40" /><span className="text-xs">No</span></div>
              </div>
            </div>
          )}
        </div>
      );
    }

    case "health_consent": {
      const hcProps = (bloque as any).props || {};
      const questions = hcProps.questions || [];
      return (
        <div style={{ gridColumn: "span 2" }} className="mt-3">
          <div className="section-title flex items-center gap-2 border-b border-border pb-1 mb-3">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.1em]">
              {bloque.label || "Consentimiento de Salud"}
            </h2>
          </div>
          {questions.length > 0 ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 px-2 font-semibold">Pregunta</th>
                  <th className="text-center py-1 px-2 font-semibold w-12">Sí</th>
                  <th className="text-center py-1 px-2 font-semibold w-12">No</th>
                  <th className="text-left py-1 px-2 font-semibold">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q: any, idx: number) => (
                  <tr key={q.id ?? idx} className="border-b border-border/50">
                    <td className="py-1.5 px-2">{q.label || `Pregunta ${idx + 1}`}</td>
                    <td className="text-center py-1.5 px-2"><div className="h-3 w-3 rounded-full border border-muted-foreground/40 mx-auto" /></td>
                    <td className="text-center py-1.5 px-2"><div className="h-3 w-3 rounded-full border border-muted-foreground/40 mx-auto" /></td>
                    <td className="py-1.5 px-2">{q.hasDetail ? <span className="text-muted-foreground italic">_______________</span> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-muted-foreground italic">Sin preguntas configuradas</p>
          )}
        </div>
      );
    }

    case "data_authorization": {
      const daProps = (bloque as any).props || {};
      const items = daProps.summaryItems || [];
      const fullText = daProps.fullText;
      return (
        <div style={{ gridColumn: "span 2" }} className="mt-3">
          <div className="section-title flex items-center gap-2 border-b border-border pb-1 mb-3">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.1em]">
              {bloque.label || "Autorización de Datos"}
            </h2>
          </div>
          {fullText && <p className="text-xs leading-relaxed text-justify mb-2">{fullText}</p>}
          {items.length > 0 && (
            <ul className="list-disc list-inside space-y-0.5">
              {items.map((item: string, idx: number) => (
                <li key={idx} className="text-xs">{item}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5"><div className="h-3.5 w-3.5 border rounded bg-foreground flex items-center justify-center"><svg className="h-2.5 w-2.5 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg></div><span className="text-xs">Autorizo</span></div>
            <div className="flex items-center gap-1.5"><div className="h-3.5 w-3.5 border rounded" /><span className="text-xs">No autorizo</span></div>
          </div>
        </div>
      );
    }

    case "document_header": {
      const hp = (bloque as any).props || {};
      return (
        <div style={{ gridColumn: "span 2" }}>
          <DocumentHeader
            nombreDocumento={bloque.label || "Formato sin nombre"}
            codigo={hp.mostrarCodigo ? (hp.codigo || "---") : ""}
            version={hp.mostrarVersion ? (hp.version || "---") : ""}
            fechaCreacion={hp.fechaCreacion || "01/01/2025"}
            fechaEdicion={hp.fechaEdicion || "01/01/2025"}
            empresaNombre={hp.empresaNombre}
            sistemaGestion={hp.sistemaGestion}
            subsistema={hp.subsistema || "FORMACIÓN"}
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
// Main document component
// ---------------------------------------------------------------------------

interface FormatoPreviewDocumentProps {
  formato: Partial<FormatoFormacion>;
}

export default function FormatoPreviewDocument({ formato }: FormatoPreviewDocumentProps) {
  const meta = formato.documentMeta;
  const bloques = formato.bloques || [];
  const hasHeaderBlock = bloques.some(b => b.type === 'document_header');

  return (
    <div className="bg-white p-6" style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "12px" }}>
      {!hasHeaderBlock && (
        <DocumentHeader
          nombreDocumento={formato.nombre || "Formato sin nombre"}
          codigo={formato.codigo || "---"}
          version={formato.version || "---"}
          fechaCreacion={meta?.fechaCreacion || "01/01/2025"}
          fechaEdicion={meta?.fechaEdicion || "01/01/2025"}
          subsistema={meta?.subsistema || "FORMACIÓN"}
        />
      )}

      {/* Bloques */}
      {bloques.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4" style={{ fontSize: "12px" }}>
          {bloques.map((bloque) => (
            <React.Fragment key={bloque.id}>
              {renderBloque(bloque)}
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

// Need React import for Fragment
import React from "react";
