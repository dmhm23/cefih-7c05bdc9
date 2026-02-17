import { Persona } from "@/types/persona";
import { Matricula } from "@/types/matricula";
import { Curso } from "@/types/curso";
import DocumentHeader from "@/components/shared/DocumentHeader";
import { TIPOS_DOCUMENTO } from "@/data/formOptions";

interface Props {
  persona: Persona | null;
  matricula: Matricula;
  curso: Curso | null;
}

function getLabel(value: string | undefined, options: readonly { value: string; label: string }[]): string {
  if (!value) return "";
  return options.find((o) => o.value === value)?.label || value;
}

const TEXTO_NORMATIVO_P1 = `En cumplimiento de la Resolución 4272 de 2021, por la cual se reglamenta el trabajo seguro en alturas en Colombia, y como parte de las actividades prácticas del curso, yo, el abajo firmante, dejo constancia de que participé activamente en el diligenciamiento del Permiso de Trabajo en Alturas (PTS) y del Análisis de Trabajo Seguro (ATS) correspondientes a la práctica desarrollada en la fecha indicada.`;

const TEXTO_NORMATIVO_P2 = `Durante esta actividad, participé en la identificación de peligros, evaluación de riesgos y definición de medidas preventivas y controles relacionados con las tareas en alturas, comprendiendo la importancia de aplicar estos procedimientos antes, durante y después de la ejecución del trabajo.`;

const TEXTO_NORMATIVO_P3 = `Reconozco que esta práctica forma parte del proceso formativo obligatorio establecido por la normativa vigente, y que su finalidad es fortalecer mis competencias técnicas y mi compromiso con la seguridad y la prevención de accidentes durante la ejecución de labores en alturas.`;

const DECLARACION_ITEMS = [
  "Comprendí el objetivo y contenido del Permiso de Trabajo en Alturas (PTS) y el Análisis de Trabajo Seguro (ATS).",
  "Participé en el diligenciamiento real del formato junto con mis compañeros de curso.",
  "Asumo el compromiso de aplicar este conocimiento en cualquier labor en alturas, conforme a la legislación vigente.",
];

export default function ParticipacionPtaAtsDocument({ persona, matricula }: Props) {
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
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-justify normative-text">{TEXTO_NORMATIVO_P1}</p>
          <p className="text-sm leading-relaxed text-justify normative-text">{TEXTO_NORMATIVO_P2}</p>
          <p className="text-sm leading-relaxed text-justify normative-text">{TEXTO_NORMATIVO_P3}</p>
          <p className="text-sm font-semibold mt-4">Con mi firma digital, declaro que:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed">
            {DECLARACION_ITEMS.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Datos del participante */}
      <div className="section-group">
        <div className="section-title border-b pb-1 mb-3">
          <h2 className="text-base font-bold uppercase tracking-widest">Datos del Participante</h2>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 grid-2">
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
