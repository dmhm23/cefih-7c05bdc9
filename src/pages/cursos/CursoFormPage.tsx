import { useState, useMemo, useRef, useCallback } from "react";
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { differenceInCalendarDays } from "date-fns";
import { parseLocalDate } from "@/utils/dateUtils";
import { cursoService } from "@/services/cursoService";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DateField } from "@/components/shared/DateField";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { CamposAdicionalesCard } from "@/components/cursos/CamposAdicionalesCard";
import { useCreateCurso } from "@/hooks/useCursos";
import { useNivelesFormacion } from "@/hooks/useNivelesFormacion";
import { useToast } from "@/hooks/use-toast";
import { usePersonalByTipoCargo } from "@/hooks/usePersonal";
import { CampoAdicional } from "@/types/nivelFormacion";

const baseSchema = {
  tipoFormacion: z.string().min(1, "Seleccione el tipo de formación"),
  numeroCurso: z.string().optional(),
  fechaInicio: z.string().min(1, "Seleccione la fecha de inicio"),
  fechaFin: z.string().optional(),
  duracionDias: z.coerce.number().min(1, "Mínimo 1 día"),
  horasTotales: z.coerce.number().min(1, "Mínimo 1 hora"),
  entrenadorId: z.string().min(1, "Seleccione un entrenador"),
  entrenadorNombre: z.string(),
  supervisorId: z.string().optional(),
  supervisorNombre: z.string().optional(),
  capacidadMaxima: z.coerce.number().min(1, "Mínimo 1").max(50, "Máximo 50").optional(),
};

function buildDynamicSchema(campos: CampoAdicional[]) {
  const dynamicShape: Record<string, z.ZodTypeAny> = {};
  for (const c of campos) {
    const key = `_ca_${c.id}`;
    switch (c.tipo) {
      case "texto_corto":
      case "texto_largo":
      case "fecha":
      case "fecha_hora":
      case "telefono":
      case "archivo":
        dynamicShape[key] = c.obligatorio
          ? z.string().min(1, `${c.nombre} es obligatorio`)
          : z.string().optional().default("");
        break;
      case "numerico":
        dynamicShape[key] = c.obligatorio
          ? z.coerce.number({ invalid_type_error: `${c.nombre} debe ser numérico` }).min(0, `${c.nombre} es obligatorio`)
          : z.coerce.number().optional().default(0);
        break;
      case "select":
      case "estado":
        dynamicShape[key] = c.obligatorio
          ? z.string().min(1, `${c.nombre} es obligatorio`)
          : z.string().optional().default(c.tipo === "estado" ? "inactivo" : "");
        break;
      case "select_multiple":
        dynamicShape[key] = c.obligatorio
          ? z.array(z.string()).min(1, `Seleccione al menos una opción en ${c.nombre}`)
          : z.array(z.string()).optional().default([]);
        break;
      case "booleano":
        dynamicShape[key] = z.boolean().optional().default(false);
        break;
      case "url":
        dynamicShape[key] = c.obligatorio
          ? z.string().url(`${c.nombre} debe ser una URL válida`)
          : z.string().url(`${c.nombre} debe ser una URL válida`).or(z.literal("")).optional().default("");
        break;
      case "email":
        dynamicShape[key] = c.obligatorio
          ? z.string().email(`${c.nombre} debe ser un email válido`)
          : z.string().email(`${c.nombre} debe ser un email válido`).or(z.literal("")).optional().default("");
        break;
      default:
        dynamicShape[key] = z.any().optional();
    }
  }
  return dynamicShape;
}

function getDefaults(campos: CampoAdicional[]): Record<string, any> {
  const defaults: Record<string, any> = {};
  for (const c of campos) {
    const key = `_ca_${c.id}`;
    switch (c.tipo) {
      case "booleano": defaults[key] = false; break;
      case "select_multiple": defaults[key] = []; break;
      case "estado": defaults[key] = "inactivo"; break;
      case "numerico": defaults[key] = 0; break;
      default: defaults[key] = "";
    }
  }
  return defaults;
}

export default function CursoFormPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const createCurso = useCreateCurso();
  const { data: niveles = [] } = useNivelesFormacion();
  const { data: entrenadores = [] } = usePersonalByTipoCargo('entrenador');
  const { data: supervisores = [] } = usePersonalByTipoCargo('supervisor');
  const [camposAdicionales, setCamposAdicionales] = useState<CampoAdicional[]>([]);
  const [numeroCursoManual, setNumeroCursoManual] = useState(false);
  const numeroCursoAutoRef = useRef("");

  const schema = useMemo(
    () => z.object({ ...baseSchema, ...buildDynamicSchema(camposAdicionales) }),
    [camposAdicionales]
  );

  const schemaRef = useRef(schema);
  schemaRef.current = schema;

  const dynamicResolver = useCallback(
    (values: any, context: any, options: any) =>
      zodResolver(schemaRef.current)(values, context, options),
    []
  );

  const nivelesOptions = niveles.map((n) => ({
    value: n.id,
    label: n.nombreNivel,
  }));

  const form = useForm<any>({
    resolver: dynamicResolver,
    defaultValues: {
      tipoFormacion: "",
      numeroCurso: "",
      fechaInicio: "",
      fechaFin: "",
      duracionDias: 3,
      horasTotales: 24,
      entrenadorId: "",
      entrenadorNombre: "",
      supervisorId: "",
      supervisorNombre: "",
      capacidadMaxima: 20,
    },
  });

  const recalcularDuracion = (inicio: string, fin: string) => {
    if (!inicio || !fin) return;
    const dInicio = parseLocalDate(inicio) ?? new Date(inicio);
    const dFin = parseLocalDate(fin) ?? new Date(fin);
    const dias = differenceInCalendarDays(dFin, dInicio);
    if (dias >= 0) form.setValue("duracionDias", dias + 1);
  };

  const generarNumeroCurso = async (nivelId: string, fechaInicio: string) => {
    if (!nivelId || !fechaInicio) return;
    const nivel = niveles.find((n) => n.id === nivelId);
    if (!nivel) return;
    const config = nivel.configuracionCodigoEstudiante;
    if (!config || !config.activo) {
      numeroCursoAutoRef.current = "";
      if (!numeroCursoManual) form.setValue("numeroCurso", "");
      return;
    }
    const date = parseLocalDate(fechaInicio) ?? new Date(fechaInicio);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const anio2d = String(year).slice(-2);
    const mes2d = String(month).padStart(2, '0');
    const count = await cursoService.countByNivelAndMonth(nivelId, year, month);
    const consecutivo = String(count + 1).padStart(2, '0');
    const sep = config.separadorCodigo || '-';
    const codigo = `${config.prefijoCodigo}${sep}${config.codigoTipoFormacion}${sep}${anio2d}${sep}${mes2d}${sep}${consecutivo}`;
    numeroCursoAutoRef.current = codigo;
    if (!numeroCursoManual) form.setValue("numeroCurso", codigo);
  };

  const handleTipoFormacionChange = (value: string) => {
    form.setValue("tipoFormacion", value);
    const nivel = niveles.find((n) => n.id === value);
    if (nivel) {
      if (nivel.duracionHoras) form.setValue("horasTotales", nivel.duracionHoras);

      const campos = nivel.camposAdicionales || [];
      setCamposAdicionales(campos);

      // Clear old dynamic values and set defaults for new ones
      const currentValues = form.getValues();
      const caKeys = Object.keys(currentValues).filter((k) => k.startsWith("_ca_"));
      caKeys.forEach((k) => form.unregister(k));

      const defaults = getDefaults(campos);
      Object.entries(defaults).forEach(([k, v]) => form.setValue(k, v));

      // Regenerar número de curso
      const fechaInicio = form.getValues("fechaInicio");
      if (fechaInicio) generarNumeroCurso(value, fechaInicio);
      else form.setValue("numeroCurso", "");
    } else {
      setCamposAdicionales([]);
      form.setValue("numeroCurso", "");
    }
  };

  const handleEntrenadorChange = (entrenadorId: string) => {
    const e = entrenadores.find((x) => x.id === entrenadorId);
    if (e) {
      form.setValue("entrenadorId", entrenadorId);
      form.setValue("entrenadorNombre", `${e.nombres} ${e.apellidos}`);
    }
  };

  const handleSupervisorChange = (supervisorId: string) => {
    if (supervisorId === "_none") {
      form.setValue("supervisorId", "");
      form.setValue("supervisorNombre", "");
      return;
    }
    const s = supervisores.find((x) => x.id === supervisorId);
    if (s) {
      form.setValue("supervisorId", supervisorId);
      form.setValue("supervisorNombre", `${s.nombres} ${s.apellidos}`);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      // Separate dynamic field values
      const camposAdicionalesValores: Record<string, any> = {};
      for (const campo of camposAdicionales) {
        const key = `_ca_${campo.id}`;
        camposAdicionalesValores[campo.id] = data[key];
      }

      const nivel = niveles.find((n) => n.id === data.tipoFormacion);
      const tipoFormacionDb = nivel?.tipoFormacion || 'formacion_inicial';
      // Solo enviar nombre si el usuario lo editó manualmente
      const nombreFinal = numeroCursoManual ? (data.numeroCurso || '') : '';
      // Calcular duración real desde fechas
      let duracionDiasReal = data.duracionDias || 0;
      if (data.fechaInicio && data.fechaFin) {
        const dI = parseLocalDate(data.fechaInicio) ?? new Date(data.fechaInicio);
        const dF = parseLocalDate(data.fechaFin) ?? new Date(data.fechaFin);
        const dias = differenceInCalendarDays(dF, dI);
        if (dias >= 0) duracionDiasReal = dias + 1;
      }
      await createCurso.mutateAsync({
        nombre: nombreFinal,
        descripcion: "",
        tipoFormacion: tipoFormacionDb as any,
        nivelFormacionId: data.tipoFormacion,
        numeroCurso: data.numeroCurso,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin ?? "",
        duracionDias: duracionDiasReal,
        horasTotales: data.horasTotales,
        entrenadorId: data.entrenadorId,
        entrenadorNombre: data.entrenadorNombre,
        supervisorId: data.supervisorId,
        supervisorNombre: data.supervisorNombre,
        capacidadMaxima: data.capacidadMaxima || 20,
        estado: "en_progreso",
        camposAdicionalesValores: Object.keys(camposAdicionalesValores).length > 0
          ? camposAdicionalesValores : undefined,
      });
      toast({ title: "Curso creado correctamente" });
      logActivity({ action: "crear", module: "cursos", description: `Creó un nuevo curso de tipo ${data.tipoFormacion}`, entityType: "curso" });
      navigate("/cursos");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el curso",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <IconButton tooltip="Volver" onClick={() => navigate("/cursos")}>
          <ArrowLeft className="h-4 w-4" />
        </IconButton>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Curso</h1>
          <p className="text-sm text-muted-foreground">Crear un nuevo curso de formación</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Card A — Identificación */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Identificación del Curso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipoFormacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo / Nivel de Formación *</FormLabel>
                      <FormControl>
                        <Combobox
                          options={nivelesOptions}
                          value={field.value}
                          onValueChange={handleTipoFormacionChange}
                          placeholder="Seleccionar nivel..."
                          searchPlaceholder="Buscar nivel..."
                          emptyMessage="No se encontraron niveles."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numeroCurso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número del Curso</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Se genera automáticamente al guardar"
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            setNumeroCursoManual(e.target.value !== "" && e.target.value !== numeroCursoAutoRef.current);
                          }}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        {numeroCursoManual ? "Valor manual — se usará tal cual" : "Vista previa — el valor oficial se asigna al guardar"}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fechaInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Inicio *</FormLabel>
                      <FormControl>
                        <DateField
                          value={field.value}
                          onChange={(v) => {
                            field.onChange(v);
                            recalcularDuracion(v, form.getValues("fechaFin"));
                            const nivelId = form.getValues("tipoFormacion");
                            if (nivelId && v) generarNumeroCurso(nivelId, v);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fechaFin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Fin</FormLabel>
                      <FormControl>
                        <DateField
                          value={field.value}
                          onChange={(v) => {
                            field.onChange(v);
                            recalcularDuracion(form.getValues("fechaInicio"), v);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card B — Duración */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Duración</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="horasTotales"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas Totales *</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min={1} max={200} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">Heredadas del nivel de formación</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duracionDias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración (días)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min={1} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">Auto-calculado desde fechas, editable manualmente</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card C — Operación */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Operación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="entrenadorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entrenador *</FormLabel>
                      <Select onValueChange={handleEntrenadorChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {entrenadores.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.nombres} {e.apellidos}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supervisorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supervisor</FormLabel>
                      <Select onValueChange={handleSupervisorChange} value={field.value || "_none"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Opcional..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="_none">Sin supervisor</SelectItem>
                          {supervisores.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nombres} {s.apellidos}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacidadMaxima"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidad Máxima</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min={1} max={50} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card D — Campos Adicionales (dinámicos) */}
          <CamposAdicionalesCard campos={camposAdicionales} form={form} />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/cursos")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createCurso.isPending}>
              {createCurso.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Curso
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
