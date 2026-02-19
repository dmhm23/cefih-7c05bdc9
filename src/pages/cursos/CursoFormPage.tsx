import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useCreateCurso } from "@/hooks/useCursos";
import { useToast } from "@/hooks/use-toast";
import { TIPOS_FORMACION_CURSO, ENTRENADORES_MOCK, SUPERVISORES_MOCK } from "@/data/formOptions";
import { TIPO_FORMACION_LABELS } from "@/types/curso";

const cursoSchema = z.object({
  tipoFormacion: z.enum(["jefe_area", "trabajador_autorizado", "reentrenamiento", "coordinador_ta"], {
    required_error: "Seleccione el tipo de formación",
  }),
  numeroCurso: z.string().min(1, "Ingrese el número del curso"),
  fechaInicio: z.string().min(1, "Seleccione la fecha de inicio"),
  fechaFin: z.string().min(1, "Seleccione la fecha de fin"),
  duracionDias: z.coerce.number().min(1, "Mínimo 1 día"),
  horasTotales: z.coerce.number().min(1, "Mínimo 1 hora"),
  entrenadorId: z.string().min(1, "Seleccione un entrenador"),
  entrenadorNombre: z.string(),
  supervisorId: z.string().optional(),
  supervisorNombre: z.string().optional(),
  capacidadMaxima: z.coerce.number().min(1, "Mínimo 1").max(50, "Máximo 50").optional(),
});

type FormValues = z.infer<typeof cursoSchema>;

export default function CursoFormPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createCurso = useCreateCurso();

  const form = useForm<FormValues>({
    resolver: zodResolver(cursoSchema),
    defaultValues: {
      tipoFormacion: undefined,
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

  const handleTipoFormacionChange = (value: string) => {
    form.setValue("tipoFormacion", value as FormValues["tipoFormacion"]);
    const tipo = TIPOS_FORMACION_CURSO.find((t) => t.value === value);
    if (tipo) {
      form.setValue("duracionDias", tipo.duracionDias);
      form.setValue("horasTotales", tipo.horasTotales);
    }
  };

  const handleEntrenadorChange = (entrenadorId: string) => {
    const e = ENTRENADORES_MOCK.find((x) => x.id === entrenadorId);
    if (e) {
      form.setValue("entrenadorId", entrenadorId);
      form.setValue("entrenadorNombre", e.nombre);
    }
  };

  const handleSupervisorChange = (supervisorId: string) => {
    if (supervisorId === "_none") {
      form.setValue("supervisorId", "");
      form.setValue("supervisorNombre", "");
      return;
    }
    const s = SUPERVISORES_MOCK.find((x) => x.id === supervisorId);
    if (s) {
      form.setValue("supervisorId", supervisorId);
      form.setValue("supervisorNombre", s.nombre);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const label = TIPO_FORMACION_LABELS[data.tipoFormacion];
      await createCurso.mutateAsync({
        nombre: `${label} - #${data.numeroCurso}`,
        descripcion: "",
        tipoFormacion: data.tipoFormacion,
        numeroCurso: data.numeroCurso,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        duracionDias: data.duracionDias,
        horasTotales: data.horasTotales,
        entrenadorId: data.entrenadorId,
        entrenadorNombre: data.entrenadorNombre,
        supervisorId: data.supervisorId,
        supervisorNombre: data.supervisorNombre,
        capacidadMaxima: data.capacidadMaxima || 20,
        estado: "abierto",
      });
      toast({ title: "Curso creado correctamente" });
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
        <Button variant="ghost" size="icon" onClick={() => navigate("/cursos")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
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
                      <Select onValueChange={handleTipoFormacionChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIPOS_FORMACION_CURSO.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
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
                  name="numeroCurso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número del Curso *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: TA-2026-001" />
                      </FormControl>
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
                        <Input type="date" {...field} />
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
                      <FormLabel>Fecha de Fin *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                  name="duracionDias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración (días) *</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min={1} max={30} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horasTotales"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas Totales *</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min={1} max={200} />
                      </FormControl>
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
                          {ENTRENADORES_MOCK.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.nombre}
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
                          {SUPERVISORES_MOCK.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nombre}
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
