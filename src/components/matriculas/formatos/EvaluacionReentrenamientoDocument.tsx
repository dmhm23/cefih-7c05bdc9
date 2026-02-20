/**
 * EvaluacionReentrenamientoDocument — Renderer puro FIH04-019
 *
 * PREPARADO PARA VISTA DEL ESTUDIANTE:
 * Este componente no asume contexto administrativo. Recibe datos puros
 * (persona, matricula, curso) y un callback `onSubmit` desacoplado.
 * La futura Vista del Estudiante puede conectar onSubmit a su propio
 * endpoint sin necesidad de refactorizar este renderer.
 *
 * PROP `modo`:
 *   "diligenciamiento" (default) → muestra RadioGroups interactivos + botón Enviar
 *                                   (futuro uso en Vista del Estudiante)
 *   "resultados"                 → bloque compacto de resultado + tabla preguntas/respuestas
 *                                   + encuesta solo lectura (vista admin en /matriculas/:id)
 */

import { useState } from "react";
import { Persona } from "@/types/persona";
import { Matricula } from "@/types/matricula";
import { Curso } from "@/types/curso";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TIPOS_DOCUMENTO, NIVELES_FORMACION_EMPRESA } from "@/data/formOptions";
import DocumentHeader from "@/components/shared/DocumentHeader";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  persona: Persona | null;
  matricula: Matricula;
  curso: Curso | null;
  /**
   * Bifurca el comportamiento del renderer:
   * - "diligenciamiento": preguntas interactivas + botón Enviar (futuro estudiante)
   * - "resultados": bloque compacto + tabla preguntas + encuesta solo lectura (admin)
   * Por defecto: "diligenciamiento"
   */
  modo?: "diligenciamiento" | "resultados";
  /**
   * Callback desacoplado — el contexto admin lo conecta a updateMatricula.
   * La futura Vista del Estudiante puede conectarlo a su propio endpoint.
   */
  onSubmit?: (data: {
    evaluacionCompletada: boolean;
    evaluacionPuntaje: number;
    evaluacionRespuestas: number[];
    encuestaRespuestas: string[];
  }) => void;
}

interface Pregunta {
  id: number;
  texto: string;
  opciones: string[];
  correcta: number;
}

// ---------------------------------------------------------------------------
// Preguntas hardcodeadas — Reentrenamiento Trabajo en Alturas (Res. 4272/2021)
// ---------------------------------------------------------------------------

const PREGUNTAS: Pregunta[] = [
  {
    id: 1,
    texto: "La Resolución 4272 de 2021 establece los requisitos mínimos de seguridad para el trabajo seguro en alturas en Colombia.",
    opciones: ["Verdadero", "Falso"],
    correcta: 0,
  },
  {
    id: 2,
    texto: "Se considera trabajo en alturas toda actividad que se realice a una altura igual o superior a:",
    opciones: ["1 metro", "1.5 metros", "2 metros", "3 metros"],
    correcta: 2,
  },
  {
    id: 3,
    texto: "El sistema de arresto de caídas (arnés de cuerpo completo + línea de vida + punto de anclaje) tiene como objetivo:",
    opciones: [
      "Prevenir la caída del trabajador",
      "Detener la caída una vez ocurre y minimizar lesiones",
      "Reemplazar el uso de andamios",
      "Permitir el trabajo sin supervisión",
    ],
    correcta: 1,
  },
  {
    id: 4,
    texto: "El punto de anclaje para trabajo en alturas debe soportar una carga mínima de:",
    opciones: ["5 kN (500 kg)", "15 kN (1.500 kg)", "22.2 kN (2.268 kg)", "30 kN (3.000 kg)"],
    correcta: 2,
  },
  {
    id: 5,
    texto: "Antes de iniciar un trabajo en alturas es obligatorio diligenciar el Análisis de Trabajo Seguro (ATS) y obtener el permiso de trabajo.",
    opciones: ["Verdadero", "Falso"],
    correcta: 0,
  },
  {
    id: 6,
    texto: "El factor de caída se define como la relación entre:",
    opciones: [
      "El peso del trabajador y la resistencia del arnés",
      "La distancia de caída y la longitud de la cuerda de vida",
      "La altura del punto de anclaje y el piso",
      "La velocidad de caída y el tiempo de detención",
    ],
    correcta: 1,
  },
  {
    id: 7,
    texto: "¿Cuál de las siguientes es una medida de PREVENCIÓN contra caídas (no de protección)?",
    opciones: [
      "Arnés de cuerpo completo",
      "Red de seguridad",
      "Delimitación y señalización del área de trabajo",
      "Línea de vida horizontal",
    ],
    correcta: 2,
  },
  {
    id: 8,
    texto: "El equipo de protección personal (EPP) para trabajo en alturas incluye obligatoriamente el casco con barbuquejo en posición de uso.",
    opciones: ["Verdadero", "Falso"],
    correcta: 0,
  },
  {
    id: 9,
    texto: "Un trabajador autorizado para trabajo en alturas está capacitado para:",
    opciones: [
      "Diseñar sistemas de anclaje y supervisar a otros trabajadores",
      "Ingresar a zonas con riesgo de caída y realizar la tarea bajo supervisión del coordinador",
      "Aprobar permisos de trabajo y hacer inspección de equipos",
      "Reemplazar al coordinador de trabajo en alturas en su ausencia",
    ],
    correcta: 1,
  },
  {
    id: 10,
    texto: "La vida útil de un arnés de cuerpo completo que ha detenido una caída es:",
    opciones: [
      "Puede seguir usándose si no presenta daños visibles",
      "Se reduce a la mitad de su vida útil original",
      "Termina inmediatamente; debe retirarse del servicio",
      "Se extiende si se somete a mantenimiento",
    ],
    correcta: 2,
  },
  {
    id: 11,
    texto: "La distancia de detención total en un sistema de arresto de caídas incluye: longitud del absorbedor de impacto + distancia de extensión de la cuerda + desplazamiento del cuerpo del trabajador.",
    opciones: ["Verdadero", "Falso"],
    correcta: 0,
  },
  {
    id: 12,
    texto: "¿Qué acción debe tomar un trabajador al detectar un equipo de alturas con daño visible antes de iniciar labores?",
    opciones: [
      "Reportarlo al coordinador y NO usar el equipo hasta que sea inspeccionado y/o reemplazado",
      "Usarlo con precaución si el daño parece menor",
      "Repararlo él mismo si tiene los conocimientos",
      "Continuar el trabajo y reportarlo al finalizar la jornada",
    ],
    correcta: 0,
  },
  {
    id: 13,
    texto: "El síndrome de arnés (trauma por suspensión) puede ocurrir cuando un trabajador queda suspendido en el arnés sin movimiento por más de:",
    opciones: ["1 minuto", "5 minutos", "30 minutos", "1 hora"],
    correcta: 1,
  },
  {
    id: 14,
    texto: "Los andamios tubulares deben ser inspeccionados y autorizados por una persona competente antes de su uso.",
    opciones: ["Verdadero", "Falso"],
    correcta: 0,
  },
  {
    id: 15,
    texto: "El programa de protección contra caídas de una empresa debe incluir como mínimo:",
    opciones: [
      "Inventario de EPP únicamente",
      "Identificación de peligros, medidas de prevención y protección, inspección de equipos, y procedimiento de rescate",
      "Solo el procedimiento de rescate y primeros auxilios",
      "Únicamente la capacitación del personal",
    ],
    correcta: 1,
  },
];

const UMBRAL_APROBACION = 70; // porcentaje mínimo para aprobar

// ---------------------------------------------------------------------------
// Encuesta de Satisfacción — constantes
// ---------------------------------------------------------------------------

const ENCUESTA_ESCALA = [
  "¿Qué tan satisfecho se encuentra con la capacitación y entrenamiento en trabajo en alturas recibida?",
  "¿Qué tan satisfecho se encuentra con el servicio al cliente recibido por parte de todo el personal de la empresa?",
  "¿Qué tan satisfecho se encuentra con la amabilidad y el trato recibido por parte del personal?",
  "¿Qué tan satisfecho se encuentra con la calidad del servicio brindado durante todo el proceso?",
];

const OPCIONES_ESCALA = [
  { value: "muy_satisfecho", label: "Muy satisfecho" },
  { value: "satisfecho", label: "Satisfecho" },
  { value: "poco_satisfecho", label: "Poco satisfecho" },
  { value: "insatisfecho", label: "Insatisfecho" },
];

const ENCUESTA_SI_NO = "¿Volvería a contratar y recomendaría el servicio recibido?";
const OPCIONES_SI_NO = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: es });
  } catch {
    return dateStr;
  }
}

function getLabel(value: string | undefined, options: readonly { value: string; label: string }[]): string {
  if (!value) return "";
  return options.find((o) => o.value === value)?.label || value;
}

function FieldCell({ label, value, span, span3 }: { label: string; value?: string; span?: boolean; span3?: boolean }) {
  const isEmpty = !value || value.trim() === "";
  return (
    <div className={`field-cell ${span3 ? "col-span-3 field-span3" : span ? "col-span-2 field-span" : ""}`}>
      <p className="field-label text-[10px] uppercase tracking-wide text-muted-foreground leading-tight">{label}</p>
      <p className={`field-value text-sm font-medium leading-snug ${isEmpty ? "text-muted-foreground/50 italic field-empty" : ""}`}>
        {isEmpty ? "Pendiente" : value}
      </p>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="section-title border-b pb-1 mb-3 flex items-center gap-2">
      <h2 className="text-base font-bold uppercase tracking-widest">{title}</h2>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bloque compacto de resultado — modo="resultados"
// ---------------------------------------------------------------------------

function ResultadoCompacto({ puntaje }: { puntaje: number }) {
  const aprobado = puntaje >= UMBRAL_APROBACION;
  const correctas = Math.round((puntaje * PREGUNTAS.length) / 100);

  return (
    <div className="resultado-compacto grid grid-cols-2 gap-0 border rounded-lg overflow-hidden">
      {/* Fila 1: Resultado principal */}
      <div className="px-5 py-3 border-b">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Resultado de la evaluación</p>
      </div>
      <div className="px-5 py-3 border-b border-l flex items-center gap-3">
        <div>
          <span className={`resultado-ratio text-2xl font-semibold ${aprobado ? "text-emerald-600" : "text-destructive"}`}>
            {correctas}/{PREGUNTAS.length}
          </span>
          <p className={`resultado-pct text-xs mt-0.5 ${aprobado ? "text-emerald-600/80" : "text-destructive/80"}`}>
            {puntaje.toFixed(2)}%
          </p>
        </div>
        <Badge
          className={`resultado-badge-print shrink-0 ${
            aprobado
              ? "bg-emerald-600 text-white hover:bg-emerald-600"
              : "bg-destructive text-destructive-foreground hover:bg-destructive"
          }`}
        >
          {aprobado ? "✓ Aprobado" : "✗ No aprobado"}
        </Badge>
      </div>

      {/* Fila 2: Respuestas correctas / puntaje mínimo */}
      <div className="px-5 py-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Respuestas correctas</p>
      </div>
      <div className="px-5 py-3 border-l">
        <p className="text-sm font-medium text-foreground">
          {correctas} de {PREGUNTAS.length} — Mínimo requerido: {UMBRAL_APROBACION}%
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabla de preguntas y respuestas — modo="resultados"
// ---------------------------------------------------------------------------

function TablaRespuestas({ evaluacionRespuestas }: { evaluacionRespuestas: number[] }) {
  return (
    <table className="tabla-preguntas w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="pb-2 text-left text-xs text-muted-foreground uppercase tracking-wide w-8">#</th>
          <th className="pb-2 text-left text-xs text-muted-foreground uppercase tracking-wide">Pregunta</th>
          <th className="pb-2 text-left text-xs text-muted-foreground uppercase tracking-wide w-52">Respuesta seleccionada</th>
          <th className="pb-2 text-center text-xs text-muted-foreground uppercase tracking-wide w-16">Calif.</th>
        </tr>
      </thead>
      <tbody>
        {PREGUNTAS.map((p, idx) => {
          const respIdx = evaluacionRespuestas[idx];
          const esCorrecto = respIdx === p.correcta;
          return (
            <tr key={p.id} className="border-b last:border-0">
              <td className="py-2.5 text-muted-foreground align-top">{p.id}</td>
              <td className="py-2.5 align-top leading-snug pr-3">{p.texto}</td>
              <td className={`py-2.5 align-top ${!esCorrecto ? "text-destructive/70" : ""}`}>
                {respIdx !== undefined
                  ? `${["a", "b", "c", "d"][respIdx]}. ${p.opciones[respIdx]}`
                  : "—"}
              </td>
              <td className="py-2.5 text-center align-top">
                {esCorrecto ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive mx-auto" />
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// Encuesta solo lectura — modo="resultados"
// ---------------------------------------------------------------------------

function EncuestaResultados({ encuestaRespuestas }: { encuestaRespuestas?: string[] }) {
  if (!encuestaRespuestas || encuestaRespuestas.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
        <Clock className="h-4 w-4 shrink-0" />
        <span>Encuesta pendiente de diligenciar.</span>
      </div>
    );
  }

  return (
    <table className="tabla-preguntas w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="pb-2 text-left text-xs text-muted-foreground uppercase tracking-wide w-8">#</th>
          <th className="pb-2 text-left text-xs text-muted-foreground uppercase tracking-wide">Pregunta</th>
          <th className="pb-2 text-left text-xs text-muted-foreground uppercase tracking-wide w-44">Respuesta</th>
        </tr>
      </thead>
      <tbody>
        {ENCUESTA_ESCALA.map((pregunta, idx) => {
          const respVal = encuestaRespuestas[idx];
          const label = OPCIONES_ESCALA.find((o) => o.value === respVal)?.label ?? respVal ?? "—";
          return (
            <tr key={idx} className="border-b last:border-0">
              <td className="py-2.5 text-muted-foreground align-top">{idx + 1}</td>
              <td className="py-2.5 align-top leading-snug pr-3">{pregunta}</td>
              <td className="py-2.5 align-top font-medium">{label}</td>
            </tr>
          );
        })}
        <tr className="last:border-0">
          <td className="py-2.5 text-muted-foreground align-top">{ENCUESTA_ESCALA.length + 1}</td>
          <td className="py-2.5 align-top leading-snug pr-3">{ENCUESTA_SI_NO}</td>
          <td className="py-2.5 align-top font-medium">
            {OPCIONES_SI_NO.find((o) => o.value === encuestaRespuestas[4])?.label ?? encuestaRespuestas[4] ?? "—"}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// Bloque pendiente — cuando evaluacionCompletada=false en modo="resultados"
// ---------------------------------------------------------------------------

function EvaluacionPendiente() {
  return (
    <div className="resultado-bloque border-2 border-amber-300 bg-amber-50/60 rounded-xl p-8 text-center space-y-3">
      <div className="flex items-center justify-center gap-2">
        <Clock className="h-6 w-6 text-amber-600" />
        <p className="text-lg font-bold text-amber-700">Evaluación Pendiente</p>
      </div>
      <p className="text-sm text-amber-700/80">
        El participante aún no ha diligenciado esta evaluación. El resultado aparecerá
        aquí una vez sea completada desde la vista del estudiante.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function EvaluacionReentrenamientoDocument({
  persona,
  matricula,
  curso,
  modo = "diligenciamiento",
  onSubmit,
}: Props) {
  // Estado local — solo relevante en modo "diligenciamiento"
  const [respuestas, setRespuestas] = useState<(number | undefined)[]>(
    PREGUNTAS.map(() => undefined)
  );
  const [encuestaLocal, setEncuestaLocal] = useState<string[]>(
    Array(ENCUESTA_ESCALA.length + 1).fill("")
  );
  const [submitted, setSubmitted] = useState(false);

  const yaCompletada = matricula.evaluacionCompletada;
  const puntajeGuardado = matricula.evaluacionPuntaje;
  const evaluacionRespuestas = matricula.evaluacionRespuestas;
  const encuestaRespuestas = matricula.encuestaRespuestas;

  const fechaHoy = format(new Date(), "dd/MM/yyyy", { locale: es });

  // Handlers — solo activos en modo "diligenciamiento"
  const handleRespuesta = (preguntaIdx: number, value: string) => {
    if (yaCompletada || modo === "resultados") return;
    setRespuestas((prev) => {
      const next = [...prev];
      next[preguntaIdx] = parseInt(value);
      return next;
    });
  };

  const handleEncuesta = (idx: number, value: string) => {
    setEncuestaLocal((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handleEnviar = () => {
    if (!onSubmit || modo === "resultados") return;

    const correctas = PREGUNTAS.filter(
      (p, idx) => respuestas[idx] === p.correcta
    ).length;

    const puntaje = Math.round((correctas / PREGUNTAS.length) * 100);
    const respuestasNumericas = respuestas.map((r) => r ?? -1);

    setSubmitted(true);
    onSubmit({
      evaluacionCompletada: true,
      evaluacionPuntaje: puntaje,
      evaluacionRespuestas: respuestasNumericas,
      encuestaRespuestas: encuestaLocal,
    });
  };

  const sinResponder = respuestas.filter((r) => r === undefined).length;
  const puedeEnviar = sinResponder === 0 && !yaCompletada && modo === "diligenciamiento";

  // Puntaje para resultado local inmediato (antes de que llegue la query actualizada)
  const puntajeLocal = submitted
    ? Math.round(
        (PREGUNTAS.filter((p, idx) => respuestas[idx] === p.correcta).length /
          PREGUNTAS.length) *
          100
      )
    : null;

  const puntajeMostrar = puntajeGuardado ?? puntajeLocal;
  const aprobado =
    puntajeMostrar !== null && puntajeMostrar !== undefined
      ? puntajeMostrar >= UMBRAL_APROBACION
      : null;

  return (
    <div
      id="evaluacion-reentrenamiento-document"
      className="doc-root bg-white text-foreground p-8 max-w-[210mm] mx-auto relative print:shadow-none print:p-6 space-y-8"
    >
      {/* Encabezado institucional */}
      <DocumentHeader
        nombreDocumento="EVALUACIÓN REENTRENAMIENTO TRABAJO EN ALTURAS"
        codigo="FIH04-019"
        version="004"
        fechaCreacion="03/24"
        fechaEdicion="03/24"
        subsistema="SSTA"
      />

      {/* Datos del participante — común en ambos modos */}
      <div className="section-group">
        <SectionTitle title="Datos del Participante" />
        <div className="grid grid-cols-3 gap-x-6 gap-y-4 grid-3">
          <FieldCell label="Fecha" value={fechaHoy} />
          <FieldCell
            label="Tipo de documento"
            value={getLabel(persona?.tipoDocumento, TIPOS_DOCUMENTO)}
          />
          <FieldCell label="Número de documento" value={persona?.numeroDocumento} />
          <FieldCell
            label="Nombre completo"
            value={[persona?.nombres, persona?.apellidos].filter(Boolean).join(" ")}
            span3
          />
          <FieldCell
            label="Nivel de formación"
            value={getLabel(matricula.empresaNivelFormacion, NIVELES_FORMACION_EMPRESA)}
          />
          <FieldCell label="Empresa" value={matricula.empresaNombre || "Independiente"} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODO RESULTADOS — Vista administrativa
          ══════════════════════════════════════════════════════════════════════ */}
      {modo === "resultados" && (
        <>
          {/* Bloque de resultado compacto */}
          <div className="section-group">
            <SectionTitle title="Resultado de la Evaluación" />
            {yaCompletada && puntajeGuardado !== undefined && puntajeGuardado !== null ? (
              <ResultadoCompacto puntaje={puntajeGuardado} />
            ) : (
              <EvaluacionPendiente />
            )}
          </div>

          {/* Tabla de preguntas y respuestas */}
          {yaCompletada && evaluacionRespuestas && evaluacionRespuestas.length > 0 && (
            <div className="section-group">
              <SectionTitle title={`Preguntas y Respuestas (${PREGUNTAS.length})`} />
              <TablaRespuestas evaluacionRespuestas={evaluacionRespuestas} />
            </div>
          )}

          {/* Encuesta de satisfacción — solo lectura */}
          <div className="section-group">
            <SectionTitle title="Encuesta de Satisfacción" />
            <EncuestaResultados encuestaRespuestas={encuestaRespuestas} />
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODO DILIGENCIAMIENTO — Vista del estudiante (futuro)
          ══════════════════════════════════════════════════════════════════════ */}
      {modo === "diligenciamiento" && (
        <>
          {/* Instrucciones */}
          <div className="section-group">
            <div className="bg-muted/40 border rounded-md px-4 py-3 text-sm text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Instrucciones:</p>
              <p>
                Lea cuidadosamente cada pregunta y seleccione la respuesta que considere
                correcta. El puntaje mínimo para aprobar es del{" "}
                <strong>{UMBRAL_APROBACION}%</strong>. Una vez enviada la evaluación no
                podrá modificar sus respuestas.
              </p>
            </div>
          </div>

          {/* Preguntas */}
          <div className="section-group space-y-6">
            <SectionTitle title={`Preguntas (${PREGUNTAS.length})`} />

            {PREGUNTAS.map((pregunta, idx) => {
              const respuesta = respuestas[idx];
              const esCorrecta = respuesta !== undefined && respuesta === pregunta.correcta;
              const mostrarResultado = yaCompletada || submitted;

              return (
                <div
                  key={pregunta.id}
                  className={`border rounded-lg p-4 space-y-3 transition-colors ${
                    mostrarResultado
                      ? esCorrecta
                        ? "border-emerald-300 bg-emerald-50/50"
                        : "border-destructive/40 bg-destructive/5"
                      : "border-border"
                  }`}
                >
                  {/* Número + texto */}
                  <div className="flex gap-3">
                    <span className="shrink-0 font-bold text-sm text-muted-foreground w-6 text-right">
                      {pregunta.id}.
                    </span>
                    <p className="text-sm font-medium leading-snug">{pregunta.texto}</p>
                    {mostrarResultado && (
                      <span className="shrink-0 ml-auto">
                        {esCorrecta ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </span>
                    )}
                  </div>

                  {/* RadioGroup — visible en pantalla */}
                  <div className="screen-only-eval pl-9">
                    <RadioGroup
                      value={respuesta !== undefined ? String(respuesta) : ""}
                      onValueChange={(v) => handleRespuesta(idx, v)}
                      disabled={yaCompletada || submitted}
                      className="space-y-1.5"
                    >
                      {pregunta.opciones.map((opcion, opIdx) => {
                        const isSelected = respuesta === opIdx;
                        const isCorrectOption = opIdx === pregunta.correcta;
                        return (
                          <div
                            key={opIdx}
                            className={`flex items-center gap-2 rounded px-2 py-1 text-sm transition-colors ${
                              mostrarResultado && isCorrectOption
                                ? "text-emerald-700 font-semibold"
                                : mostrarResultado && isSelected && !isCorrectOption
                                ? "text-destructive line-through"
                                : ""
                            }`}
                          >
                            <RadioGroupItem
                              value={String(opIdx)}
                              id={`p${pregunta.id}-op${opIdx}`}
                            />
                            <Label
                              htmlFor={`p${pregunta.id}-op${opIdx}`}
                              className="cursor-pointer font-normal"
                            >
                              {opcion}
                            </Label>
                            {mostrarResultado && isCorrectOption && (
                              <span className="text-[10px] text-emerald-600 font-semibold ml-1">
                                ✓ Correcta
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>

                  {/* Texto plano — visible solo en print */}
                  <div className="print-only-eval hidden pl-9">
                    <p className="eval-print-row text-sm">
                      <span className="font-medium">Respuesta seleccionada: </span>
                      {respuesta !== undefined
                        ? pregunta.opciones[respuesta] || "Sin responder"
                        : "Sin responder"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resultado local tras enviar */}
          {(yaCompletada || submitted) &&
            puntajeMostrar !== null &&
            puntajeMostrar !== undefined && (
              <div
                className={`section-group border-2 rounded-xl p-6 text-center space-y-3 ${
                  aprobado
                    ? "border-emerald-400 bg-emerald-50/60"
                    : "border-destructive/60 bg-destructive/5"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {aprobado ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-destructive" />
                  )}
                  <p className="text-lg font-bold">
                    {aprobado ? "¡Evaluación Aprobada!" : "Evaluación No Aprobada"}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-black">{puntajeMostrar}%</span>
                  <Badge
                    className={`text-sm px-3 py-1 ${
                      aprobado
                        ? "bg-emerald-600 text-white hover:bg-emerald-600"
                        : "bg-destructive text-destructive-foreground hover:bg-destructive"
                    }`}
                  >
                    {aprobado ? "Aprobado" : "No Aprobado"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Puntaje mínimo requerido: {UMBRAL_APROBACION}% — Obtenido:{" "}
                  <strong>{puntajeMostrar}%</strong>
                </p>
              </div>
            )}

          {/* Encuesta de Satisfacción — interactiva */}
          <div className="section-group space-y-6">
            <SectionTitle title="Encuesta de Satisfacción" />
            <p className="text-sm text-muted-foreground -mt-2">
              Sus respuestas nos ayudan a mejorar la calidad de nuestros servicios.
            </p>

            {/* Preguntas de escala */}
            {ENCUESTA_ESCALA.map((pregunta, idx) => (
              <div key={idx} className="space-y-2">
                <p className="text-sm font-medium leading-snug">
                  {idx + 1}. {pregunta}
                </p>
                <div className="screen-only-eval pl-4">
                  <RadioGroup
                    value={encuestaLocal[idx] ?? ""}
                    onValueChange={(v) => handleEncuesta(idx, v)}
                    disabled={yaCompletada || submitted}
                    className="flex flex-wrap gap-x-6 gap-y-1.5"
                  >
                    {OPCIONES_ESCALA.map((opcion) => (
                      <div key={opcion.value} className="flex items-center gap-2">
                        <RadioGroupItem
                          value={opcion.value}
                          id={`enc-${idx}-${opcion.value}`}
                        />
                        <Label htmlFor={`enc-${idx}-${opcion.value}`} className="cursor-pointer font-normal text-sm">
                          {opcion.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            ))}

            {/* Pregunta Sí/No */}
            <div className="space-y-2">
              <p className="text-sm font-medium leading-snug">
                {ENCUESTA_ESCALA.length + 1}. {ENCUESTA_SI_NO}
              </p>
              <div className="screen-only-eval pl-4">
                <RadioGroup
                  value={encuestaLocal[ENCUESTA_ESCALA.length] ?? ""}
                  onValueChange={(v) => handleEncuesta(ENCUESTA_ESCALA.length, v)}
                  disabled={yaCompletada || submitted}
                  className="flex gap-6"
                >
                  {OPCIONES_SI_NO.map((opcion) => (
                    <div key={opcion.value} className="flex items-center gap-2">
                      <RadioGroupItem
                        value={opcion.value}
                        id={`enc-sino-${opcion.value}`}
                      />
                      <Label htmlFor={`enc-sino-${opcion.value}`} className="cursor-pointer font-normal text-sm">
                        {opcion.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Botón Enviar */}
          {!yaCompletada && !submitted && onSubmit && (
            <div className="screen-only-eval section-group flex flex-col items-center gap-3 pt-2">
              {sinResponder > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    {sinResponder} pregunta{sinResponder !== 1 ? "s" : ""} sin responder
                  </span>
                </div>
              )}
              <Button
                size="lg"
                disabled={!puedeEnviar}
                onClick={handleEnviar}
                className="min-w-48"
              >
                Enviar Evaluación
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
