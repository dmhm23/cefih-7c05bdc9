import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const cursoSchema = z.object({
  nombre: z.string().min(5, "El nombre debe tener al menos 5 caracteres"),
  descripcion: z.string().min(10, "Agregue una descripción"),
  fechaInicio: z.string().min(1, "Seleccione la fecha de inicio"),
  fechaFin: z.string().min(1, "Seleccione la fecha de fin"),
  duracionDias: z.coerce.number().min(1, "Mínimo 1 día"),
  horasTotales: z.coerce.number().min(1, "Mínimo 1 hora"),
  entrenadorId: z.string().min(1, "Seleccione un entrenador"),
  entrenadorNombre: z.string().min(1, "Nombre del entrenador"),
  capacidadMaxima: z.coerce.number().min(1, "Mínimo 1 estudiante").max(50, "Máximo 50 estudiantes"),
  estado: z.enum(["abierto", "en_progreso", "cerrado"]),
});

type CursoFormData = z.infer<typeof cursoSchema>;

// Mock de entrenadores (después vendría de un servicio)
const entrenadores = [
  { id: "e1", nombre: "Carlos Entrenador" },
  { id: "e2", nombre: "Maria Instructora" },
  { id: "e3", nombre: "Pedro Capacitador" },
];

export default function CursoFormPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createCurso = useCreateCurso();

  const form = useForm<CursoFormData>({
    resolver: zodResolver(cursoSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      fechaInicio: "",
      fechaFin: "",
      duracionDias: 3,
      horasTotales: 24,
      entrenadorId: "",
      entrenadorNombre: "",
      capacidadMaxima: 20,
      estado: "abierto",
    },
  });

  const onSubmit = async (data: CursoFormData) => {
    try {
      await createCurso.mutateAsync({
        nombre: data.nombre,
        descripcion: data.descripcion,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        duracionDias: data.duracionDias,
        horasTotales: data.horasTotales,
        entrenadorId: data.entrenadorId,
        entrenadorNombre: data.entrenadorNombre,
        capacidadMaxima: data.capacidadMaxima,
        estado: data.estado,
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

  const handleEntrenadorChange = (entrenadorId: string) => {
    const entrenador = entrenadores.find((e) => e.id === entrenadorId);
    if (entrenador) {
      form.setValue("entrenadorId", entrenadorId);
      form.setValue("entrenadorNombre", entrenador.nombre);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/cursos")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Curso</h1>
          <p className="text-muted-foreground">Crear un nuevo curso de formación</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Curso *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Trabajo Seguro en Alturas - Nivel Inicial" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Descripción del curso y objetivos..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entrenadorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entrenador *</FormLabel>
                    <Select onValueChange={handleEntrenadorChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar entrenador..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {entrenadores.map((e) => (
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fechas y Duración</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacidadMaxima"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidad Máxima *</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} min={1} max={50} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado Inicial *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="abierto">Abierto</SelectItem>
                        <SelectItem value="en_progreso">En Progreso</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
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
