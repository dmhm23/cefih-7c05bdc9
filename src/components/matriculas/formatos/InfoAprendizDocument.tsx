import { useState } from "react";
import { Persona } from "@/types/persona";
import { Matricula } from "@/types/matricula";
import { Curso } from "@/types/curso";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  TIPOS_DOCUMENTO,
  GENEROS,
  NIVELES_EDUCATIVOS,
  AREAS_TRABAJO,
  NIVELES_FORMACION_EMPRESA,
  PAISES,
  EPS_OPTIONS,
  ARL_OPTIONS,
} from "@/data/formOptions";

interface Props {
  persona: Persona | null;
  matricula: Matricula;
  curso: Curso | null;
}

const AUTOEVALUACION_PREGUNTAS = [
  "¿Ha realizado curso de alturas nivel Avanzado Trabajador Autorizado o Reentrenamiento con anterioridad?",
  "¿Sabe qué es un arnés y para qué sirve?",
  "¿Considera tener conocimientos y habilidades en Trabajo en Alturas?",
  "¿La Res. 4272 de 2021, es la que Establece los Requisitos Mínimos de seguridad para Trabajar en Alturas?",
  "¿Tiene presente la diferencia entre las medidas de prevención y medidas de protección contra caídas?",
  "¿Dentro de sus actividades laborales, debe desarrollar actividades superando los 2 m?",
];

type RespuestaAuto = "si" | "no" | "na";

function getLabel(value: string | undefined, options: readonly { value: string; label: string }[]): string {
  if (!value) return "";
  return options.find((o) => o.value === value)?.label || value;
}

function splitName(full: string | undefined): [string, string] {
  if (!full) return ["", ""];
  const parts = full.trim().split(/\s+/);
  return [parts[0] || "", parts.slice(1).join(" ") || ""];
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: es });
  } catch {
    return dateStr;
  }
}

function FieldCell({ label, value, span }: { label: string; value?: string; span?: boolean }) {
  const isEmpty = !value || value.trim() === "";
  return (
    <div className={`field-cell ${span ? "col-span-2 field-span" : ""}`}>
      <p className="field-label text-[10px] uppercase tracking-wide text-muted-foreground leading-tight">{label}</p>
      <p className={`field-value text-sm font-medium leading-snug ${isEmpty ? "text-muted-foreground/50 italic field-empty" : ""}`}>
        {isEmpty ? "Pendiente" : value}
      </p>
    </div>
  );
}

function SectionTitle({ title, pending }: { title: string; pending?: boolean }) {
  return (
    <div className="section-title border-b pb-1 mb-3 mt-5 first:mt-0 flex items-center gap-2">
      <h2 className="text-xs font-bold uppercase tracking-widest">{title}</h2>
      {pending && (
        <Badge variant="outline" className="badge-pending text-[10px] py-0 px-1.5 text-amber-600 border-amber-300">
          Pendiente
        </Badge>
      )}
    </div>
  );
}

export default function InfoAprendizDocument({ persona, matricula, curso }: Props) {
  const [respuestas, setRespuestas] = useState<RespuestaAuto[]>(
    AUTOEVALUACION_PREGUNTAS.map(() => "si")
  );

  const isBorrador = !matricula.autorizacionDatos || !matricula.firmaCapturada;

  const [primerNombre, segundoNombre] = splitName(persona?.nombres);
  const [primerApellido, segundoApellido] = splitName(persona?.apellidos);

  const fechaInicio = curso?.fechaInicio
    ? formatDate(curso.fechaInicio)
    : "Pendiente asignación a curso";
  const fechaFin = curso?.fechaFin
    ? formatDate(curso.fechaFin)
    : "Pendiente asignación a curso";

  const epsDisplay = matricula.eps === "otra_eps"
    ? matricula.epsOtra || "Otra (sin especificar)"
    : getLabel(matricula.eps, EPS_OPTIONS);

  const arlDisplay = matricula.arl === "otra_arl"
    ? matricula.arlOtra || "Otra (sin especificar)"
    : getLabel(matricula.arl, ARL_OPTIONS);

  return (
    <div id="info-aprendiz-document" className="doc-root bg-white text-foreground p-8 max-w-[210mm] mx-auto relative print:shadow-none print:p-6">
      {isBorrador && (
        <div className="watermark absolute inset-0 flex items-center justify-center pointer-events-none z-10 print:z-10">
          <span className="text-6xl font-black text-muted-foreground/10 -rotate-45 select-none tracking-[0.2em] uppercase">
            Borrador
          </span>
        </div>
      )}

      <div className="text-center mb-4">
        <h1 className="doc-title text-base font-bold uppercase tracking-wide">Información del Aprendiz</h1>
        {isBorrador && (
          <p className="text-xs text-amber-600 mt-1 borrador-subtitle">
            BORRADOR — Pendiente autorización y firma del aprendiz
          </p>
        )}
      </div>

      <SectionTitle title="Ficha de Matrícula" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 grid-2">
        <FieldCell label="Fecha inicio del curso" value={fechaInicio} />
        <FieldCell label="Fecha finalización del curso" value={fechaFin} />
        <FieldCell label="Empresa que paga el curso" value={matricula.empresaNombre} />
        <FieldCell label="Celular del estudiante" value={persona?.telefono} />
        <FieldCell label="Tipo de documento" value={getLabel(persona?.tipoDocumento, TIPOS_DOCUMENTO)} />
        <FieldCell label="Número de documento" value={persona?.numeroDocumento} />
        <FieldCell label="Primer nombre" value={primerNombre} />
        <FieldCell label="Segundo nombre" value={segundoNombre} />
        <FieldCell label="Primer apellido" value={primerApellido} />
        <FieldCell label="Segundo apellido" value={segundoApellido} />
        <FieldCell label="Género" value={getLabel(persona?.genero, GENEROS)} />
        <FieldCell label="País de nacimiento" value={getLabel(persona?.paisNacimiento, PAISES)} />
        <FieldCell label="Fecha de nacimiento" value={formatDate(persona?.fechaNacimiento)} />
        <FieldCell label="Nivel educativo" value={getLabel(persona?.nivelEducativo, NIVELES_EDUCATIVOS)} />
        <FieldCell label="Área de trabajo" value={getLabel(matricula.areaTrabajo, AREAS_TRABAJO)} />
        <FieldCell label="Cargo" value={matricula.empresaCargo} />
        <FieldCell label="EPS" value={epsDisplay} />
        <FieldCell label="ARL" value={arlDisplay} />
        <FieldCell
          label="Nivel de formación"
          value={getLabel(matricula.empresaNivelFormacion, NIVELES_FORMACION_EMPRESA)}
          span
        />
      </div>

      <SectionTitle title="Información de Emergencia" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 grid-2">
        <FieldCell label="Contacto de emergencia" value={persona?.contactoEmergencia?.nombre} />
        <FieldCell label="Teléfono de emergencia" value={persona?.contactoEmergencia?.telefono} />
        <FieldCell label="RH del participante" value={persona?.rh} />
      </div>

      <SectionTitle title="Consentimiento de Salud" />
      <div className="health-section space-y-1.5 text-sm">
        <div className="health-row grid grid-cols-[1fr_auto] gap-2">
          <span>¿Tiene alguna restricción médica?</span>
          <span className="font-medium">{matricula.restriccionMedica ? "Sí" : "No"}</span>
        </div>
        {matricula.restriccionMedica && matricula.restriccionMedicaDetalle && (
          <p className="health-detail text-xs text-muted-foreground pl-2">Detalle: {matricula.restriccionMedicaDetalle}</p>
        )}
        <div className="health-row grid grid-cols-[1fr_auto] gap-2">
          <span>¿Tiene alergias?</span>
          <span className="font-medium">{matricula.alergias ? "Sí" : "No"}</span>
        </div>
        {matricula.alergias && matricula.alergiasDetalle && (
          <p className="health-detail text-xs text-muted-foreground pl-2">Detalle: {matricula.alergiasDetalle}</p>
        )}
        <div className="health-row grid grid-cols-[1fr_auto] gap-2">
          <span>¿Consume medicamentos?</span>
          <span className="font-medium">{matricula.consumoMedicamentos ? "Sí" : "No"}</span>
        </div>
        {matricula.consumoMedicamentos && matricula.consumoMedicamentosDetalle && (
          <p className="health-detail text-xs text-muted-foreground pl-2">Detalle: {matricula.consumoMedicamentosDetalle}</p>
        )}
        {matricula.embarazo !== undefined && (
          <div className="health-row grid grid-cols-[1fr_auto] gap-2">
            <span>¿Se encuentra en estado de embarazo?</span>
            <span className="font-medium">{matricula.embarazo ? "Sí" : "No"}</span>
          </div>
        )}
        <div className="health-row grid grid-cols-[1fr_auto] gap-2">
          <span>¿Sabe leer y escribir?</span>
          <span className="font-medium">{matricula.nivelLectoescritura ? "Sí" : "No"}</span>
        </div>
      </div>

      <SectionTitle title="Autorización de Uso de Datos" pending />
      <p className="pending-text text-sm text-muted-foreground/60 italic">Pendiente del estudiante</p>

      <SectionTitle title="Firma del Aprendiz" pending />
      <div className="signature-box border-2 border-dashed border-muted-foreground/20 rounded h-24 flex items-center justify-center">
        <span className="pending-text text-sm text-muted-foreground/40 italic">Pendiente del estudiante</span>
      </div>

      <SectionTitle title="Autoevaluación de Conocimientos y Habilidades Previas" />
      <table className="auto-eval-table w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1.5 pr-4 text-xs font-semibold w-[70%]">Pregunta</th>
            <th className="text-center py-1.5 px-2 text-xs font-semibold w-[10%]">Sí</th>
            <th className="text-center py-1.5 px-2 text-xs font-semibold w-[10%]">No</th>
            <th className="text-center py-1.5 px-2 text-xs font-semibold w-[10%]">N/A</th>
          </tr>
        </thead>
        <tbody>
          {AUTOEVALUACION_PREGUNTAS.map((pregunta, i) => (
            <tr key={i} className="border-b last:border-b-0">
              <td className="py-1.5 pr-4 text-xs leading-snug">{pregunta}</td>
              {(["si", "no", "na"] as RespuestaAuto[]).map((opcion) => (
                <td key={opcion} className="text-center py-1.5">
                  <RadioGroup
                    value={respuestas[i]}
                    onValueChange={(val) => {
                      const next = [...respuestas];
                      next[i] = val as RespuestaAuto;
                      setRespuestas(next);
                    }}
                    className="flex justify-center"
                  >
                    <RadioGroupItem value={opcion} className="h-3.5 w-3.5" />
                  </RadioGroup>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
