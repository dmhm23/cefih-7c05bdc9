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
  fechaAsistencia: string;
  onFechaChange: (fecha: string) => void;
}

function getLabel(value: string | undefined, options: readonly { value: string; label: string }[]): string {
  if (!value) return "";
  return options.find((o) => o.value === value)?.label || value;
}

function FieldCell({ label, value, span, editable, editValue, onEditChange }: {
  label: string;
  value?: string;
  span?: boolean;
  editable?: boolean;
  editValue?: string;
  onEditChange?: (v: string) => void;
}) {
  const isEmpty = !value || value.trim() === "";
  return (
    <div className={`field-cell ${span ? "col-span-2 field-span" : ""}`}>
      <p className="field-label text-[10px] uppercase tracking-wide text-muted-foreground leading-tight">{label}</p>
      {editable ? (
        <Input
          type="date"
          value={editValue || ""}
          onChange={(e) => onEditChange?.(e.target.value)}
          className="h-7 text-sm w-44 fecha-input"
        />
      ) : (
        <p className={`field-value text-sm font-medium leading-snug ${isEmpty ? "text-muted-foreground/50 italic field-empty" : ""}`}>
          {isEmpty ? "Pendiente" : value}
        </p>
      )}
    </div>
  );
}

export default function RegistroAsistenciaDocument({ persona, matricula, curso, fechaAsistencia, onFechaChange }: Props) {
  const isBorrador = !matricula.firmaCapturada || !matricula.autorizacionDatos;
  const empresa = matricula.tipoVinculacion === "empresa" ? matricula.empresaNombre || "Sin empresa" : "Independiente";

  return (
    <div id="registro-asistencia-document" className="doc-root bg-white text-foreground p-8 max-w-[210mm] mx-auto relative print:shadow-none print:p-6 space-y-6">
      {isBorrador && (
        <div className="watermark absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <span className="text-6xl font-black text-muted-foreground/10 -rotate-45 select-none tracking-[0.2em] uppercase">
            Borrador
          </span>
        </div>
      )}

      <DocumentHeader
        nombreDocumento="REGISTRO DE ASISTENCIA DE FORMACIÓN Y ENTRENAMIENTO EN ALTURAS"
        codigo="FIH04-014"
        version="009"
        fechaCreacion="12/04/2018"
        fechaEdicion="03/2025"
        subsistema="Alturas"
      />
      {isBorrador && (
        <p className="text-xs text-amber-600 mt-1 text-center borrador-subtitle">
          BORRADOR — Pendiente autorización y firma del aprendiz
        </p>
      )}

      <div className="section-group">
        <div className="section-title border-b pb-1 mb-3">
          <h2 className="text-base font-bold uppercase tracking-widest">Datos de Asistencia</h2>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 grid-2">
          <FieldCell
            label="Fecha de asistencia"
            value={fechaAsistencia}
            editable
            editValue={fechaAsistencia}
            onEditChange={onFechaChange}
          />
          <FieldCell label="Empresa" value={empresa} />
          <FieldCell label="Nombres y Apellidos" value={persona ? `${persona.nombres} ${persona.apellidos}` : ""} span />
          <FieldCell label="Tipo de documento" value={getLabel(persona?.tipoDocumento, TIPOS_DOCUMENTO)} />
          <FieldCell label="Número de documento" value={persona?.numeroDocumento} />
          <FieldCell label="Instructor a cargo" value={curso?.entrenadorNombre} />
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
