import { Persona } from "@/types/persona";
import { Matricula } from "@/types/matricula";
import { Curso } from "@/types/curso";
import { Input } from "@/components/ui/input";
import DocumentHeader from "@/components/shared/DocumentHeader";
import { TIPOS_DOCUMENTO } from "@/data/formOptions";

interface Props {
  persona: Persona | null;
  matricula: Matricula;
  curso: Curso | null;
  fechaDiligenciamiento: string;
  onFechaChange: (fecha: string) => void;
}

function getLabel(value: string | undefined, options: readonly { value: string; label: string }[]): string {
  if (!value) return "";
  return options.find((o) => o.value === value)?.label || value;
}

const TEXTO_NORMATIVO = `En cumplimiento de lo establecido en la Resolución 4272 de 2021 del Ministerio del Trabajo, por la cual se establecen los requisitos mínimos de seguridad para el desarrollo de trabajo en alturas, declaro que he participado activamente en el diligenciamiento del Permiso de Trabajo en Alturas (PTA) y el Análisis de Trabajo Seguro (ATS), previo al inicio de las actividades de formación y entrenamiento en trabajo en alturas.`;

export default function ParticipacionPtaAtsDocument({ persona, matricula, curso, fechaDiligenciamiento, onFechaChange }: Props) {
  const isBorrador = !matricula.firmaCapturada || !matricula.autorizacionDatos;

  return (
    <div id="participacion-pta-ats-document" className="doc-root bg-white text-foreground p-8 max-w-[210mm] mx-auto relative print:shadow-none print:p-6 space-y-6">
      {isBorrador && (
        <div className="watermark absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <span className="text-6xl font-black text-muted-foreground/10 -rotate-45 select-none tracking-[0.2em] uppercase">
            Borrador
          </span>
        </div>
      )}

      <DocumentHeader
        nombreDocumento="PARTICIPACIÓN EN EL DILIGENCIAMIENTO DEL PTA - ATS"
        codigo="FIH04-077"
        version="001"
        fechaCreacion="10/03/2025"
        fechaEdicion="03/2025"
        subsistema="Alturas"
      />
      {isBorrador && (
        <p className="text-xs text-amber-600 mt-1 text-center borrador-subtitle">
          BORRADOR — Pendiente autorización y firma del aprendiz
        </p>
      )}

      {/* Texto normativo */}
      <div className="section-group">
        <div className="section-title border-b pb-1 mb-3">
          <h2 className="text-base font-bold uppercase tracking-widest">Declaración</h2>
        </div>
        <p className="text-sm leading-relaxed text-justify normative-text">{TEXTO_NORMATIVO}</p>
      </div>

      {/* Fecha de diligenciamiento */}
      <div className="section-group">
        <div className="section-title border-b pb-1 mb-3">
          <h2 className="text-base font-bold uppercase tracking-widest">Datos del Participante</h2>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 grid-2">
          <div className="field-cell">
            <p className="field-label text-[10px] uppercase tracking-wide text-muted-foreground leading-tight">Fecha de diligenciamiento</p>
            <Input
              type="date"
              value={fechaDiligenciamiento}
              onChange={(e) => onFechaChange(e.target.value)}
              className="h-7 text-sm w-44 fecha-input"
            />
          </div>
          <div className="field-cell" />
          <div className="field-cell col-span-2 field-span">
            <p className="field-label text-[10px] uppercase tracking-wide text-muted-foreground leading-tight">Nombres y Apellidos</p>
            <p className="field-value text-sm font-medium leading-snug">
              {persona ? `${persona.nombres} ${persona.apellidos}` : "Pendiente"}
            </p>
          </div>
          <div className="field-cell">
            <p className="field-label text-[10px] uppercase tracking-wide text-muted-foreground leading-tight">Tipo de documento</p>
            <p className="field-value text-sm font-medium leading-snug">
              {getLabel(persona?.tipoDocumento, TIPOS_DOCUMENTO) || "Pendiente"}
            </p>
          </div>
          <div className="field-cell">
            <p className="field-label text-[10px] uppercase tracking-wide text-muted-foreground leading-tight">Número de documento</p>
            <p className="field-value text-sm font-medium leading-snug">
              {persona?.numeroDocumento || "Pendiente"}
            </p>
          </div>
        </div>
      </div>

      {/* Firma */}
      <div className="section-group">
        <div className="section-title border-b pb-1 mb-3">
          <h2 className="text-base font-bold uppercase tracking-widest">Firma del Participante</h2>
        </div>
        {matricula.firmaCapturada && matricula.firmaBase64 ? (
          <div className="signature-box border-2 border-dashed border-muted rounded p-4 flex items-center justify-center" style={{ height: "100px" }}>
            <img src={matricula.firmaBase64} alt="Firma del participante" style={{ maxHeight: "80px", maxWidth: "250px", objectFit: "contain" }} />
          </div>
        ) : (
          <div className="signature-box border-2 border-dashed border-muted rounded p-4 flex items-center justify-center" style={{ height: "100px" }}>
            <p className="pending-text text-sm text-muted-foreground italic">Firma pendiente</p>
          </div>
        )}
      </div>
    </div>
  );
}
