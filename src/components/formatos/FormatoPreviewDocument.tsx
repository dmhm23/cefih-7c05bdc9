import DocumentHeader from "@/components/shared/DocumentHeader";
import { Badge } from "@/components/ui/badge";
import { getAutoFieldLabel } from "@/data/autoFieldCatalog";
import { BLOQUE_TYPE_LABELS } from "@/data/bloqueConstants";
import type { FormatoFormacion, Bloque } from "@/types/formatoFormacion";

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
  empresa_nivel_formacion: "Avanzado",
  empresa_nit: "900.123.456-7",
  empresa_representante_legal: "Pedro Gómez López",
  area_trabajo: "Construcción",
  sector_economico: "Construcción",
  tipo_vinculacion: "Contrato obra",
  eps_aprendiz: "Sura EPS",
  arl_aprendiz: "Sura ARL",
  nivel_previo: "Básico",
  centro_formacion_previo: "Centro de Formación XYZ",
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
            {("props" in bloque && (bloque as any).props?.text) || "Texto del párrafo..."}
          </p>
        </div>
      );

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
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground leading-tight">{bloque.label || "Selección"}</p>
          <div className="flex gap-3 mt-1">
            {options.map((opt: any, i: number) => (
              <div key={opt.value} className="flex items-center gap-1">
                <div className={`h-3.5 w-3.5 rounded-full border ${i === 0 ? "bg-foreground border-foreground" : "border-muted-foreground/40"}`} />
                <span className="text-xs">{opt.label}</span>
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

    case "auto_field": {
      const key = ("props" in bloque && (bloque as any).props?.key) || "";
      const span = ("props" in bloque && (bloque as any).props?.span) || false;
      const resolvedValue = DUMMY_AUTO_VALUES[key] || `[${getAutoFieldLabel(key)}]`;
      return (
        <FieldCell
          label={bloque.label || getAutoFieldLabel(key)}
          value={resolvedValue}
          badge="Auto"
          span={span}
        />
      );
    }

    case "signature_aprendiz":
      return (
        <div style={{ gridColumn: "span 2" }} className="mt-4">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-2">{bloque.label || "Firma del Aprendiz"}</p>
          <div className="border-2 border-dashed border-muted rounded h-24 flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground italic">Firma del Aprendiz</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Juan Carlos Pérez Martínez</p>
          </div>
        </div>
      );

    case "signature_entrenador_auto":
      return (
        <div className="mt-4">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-2">{bloque.label || "Firma del Entrenador"}</p>
          <div className="border-2 border-dashed border-muted rounded h-24 flex flex-col items-center justify-center">
            <p className="text-sm font-medium">Carlos Rodríguez</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Entrenador</p>
          </div>
        </div>
      );

    case "signature_supervisor_auto":
      return (
        <div className="mt-4">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-2">{bloque.label || "Firma del Supervisor"}</p>
          <div className="border-2 border-dashed border-muted rounded h-24 flex flex-col items-center justify-center">
            <p className="text-sm font-medium">Ana Martínez</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Supervisor</p>
          </div>
        </div>
      );

    case "attendance_by_day":
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
              {ATTENDANCE_DAYS.map((day) => (
                <tr key={day.fecha} className="border-b border-border/50">
                  <td className="py-1 px-2">{day.fecha}</td>
                  <td className="py-1 px-2">{day.entrada}</td>
                  <td className="py-1 px-2">{day.salida}</td>
                  <td className="py-1 px-2 text-muted-foreground italic">Firma</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

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

    case "document_header": {
      const hp = (bloque as any).props || {};
      return (
        <div style={{ gridColumn: "span 2" }}>
          <DocumentHeader
            nombreDocumento={bloque.label || "Formato sin nombre"}
            codigo={hp.mostrarCodigo ? "---" : ""}
            version={hp.mostrarVersion ? "---" : ""}
            fechaCreacion={hp.fechaCreacion || "01/01/2025"}
            fechaEdicion={hp.fechaEdicion || "01/01/2025"}
            empresaNombre={hp.empresaNombre}
            sistemaGestion={hp.sistemaGestion}
            subsistema={hp.subsistema || "FORMACIÓN"}
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

  return (
    <div className="bg-white p-6" style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "12px" }}>
      <DocumentHeader
        nombreDocumento={formato.nombre || "Formato sin nombre"}
        codigo={formato.codigo || "---"}
        version={formato.version || "---"}
        fechaCreacion={meta?.fechaCreacion || "01/01/2025"}
        fechaEdicion={meta?.fechaEdicion || "01/01/2025"}
        subsistema={meta?.subsistema || "FORMACIÓN"}
      />

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
