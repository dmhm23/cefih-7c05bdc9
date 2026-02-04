import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { usePersonas, usePersonaByDocumento } from "@/hooks/usePersonas";
import { useCursos } from "@/hooks/useCursos";
import { useCreateMatricula } from "@/hooks/useMatriculas";
import { useToast } from "@/hooks/use-toast";
import { TIPO_FORMACION_LABELS } from "@/types";
import { SearchInput } from "@/components/shared/SearchInput";
import { useState, useEffect } from "react";

const matriculaSchema = z.object({
  personaId: z.string().min(1, "Seleccione una persona"),
  cursoId: z.string().min(1, "Seleccione un curso"),
  tipoFormacion: z.enum(["inicial", "reentrenamiento", "avanzado", "coordinador"]),
});

type MatriculaFormData = z.infer<typeof matriculaSchema>;

export default function MatriculaFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const preselectedPersonaId = searchParams.get("personaId");

  const [documentoSearch, setDocumentoSearch] = useState("");
  const { data: personas = [] } = usePersonas();
  const { data: cursos = [] } = useCursos();
  const { data: personaByDocumento } = usePersonaByDocumento(documentoSearch);
  const createMatricula = useCreateMatricula();

  const form = useForm<MatriculaFormData>({
    resolver: zodResolver(matriculaSchema),
    defaultValues: {
      personaId: preselectedPersonaId || "",
      cursoId: "",
      tipoFormacion: "inicial",
    },
  });

  // Auto-select persona when found by documento
  useEffect(() => {
    if (personaByDocumento) {
      form.setValue("personaId", personaByDocumento.id);
    }
  }, [personaByDocumento, form]);

  const cursosAbiertos = cursos.filter((c) => c.estado !== "cerrado");
  const selectedPersona = personas.find((p) => p.id === form.watch("personaId"));

  const onSubmit = async (data: MatriculaFormData) => {
    try {
      await createMatricula.mutateAsync({
        personaId: data.personaId,
        cursoId: data.cursoId,
        tipoFormacion: data.tipoFormacion,
        firmaCapturada: false,
        evaluacionCompletada: false,
        encuestaCompletada: false,
        pagado: false,
      });
      toast({ title: "Matrícula creada correctamente" });
      navigate("/matriculas");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la matrícula",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/matriculas")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nueva Matrícula</h1>
          <p className="text-muted-foreground">Inscribir estudiante a un curso</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Búsqueda por Cédula */}
          <Card>
            <CardHeader>
              <CardTitle>Buscar Estudiante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Ingresa el número de documento para buscar al estudiante
                </p>
                <SearchInput
                  placeholder="Buscar por documento..."
                  value={documentoSearch}
                  onChange={setDocumentoSearch}
                  className="max-w-sm"
                />
              </div>

              {selectedPersona && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Estudiante seleccionado:</p>
                  <p className="font-semibold">{selectedPersona.nombres} {selectedPersona.apellidos}</p>
                  <p className="text-sm text-muted-foreground">{selectedPersona.tipoDocumento}: {selectedPersona.numeroDocumento}</p>
                </div>
              )}

              {documentoSearch.length >= 6 && !personaByDocumento && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-700">
                    No se encontró persona con este documento.{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-amber-700 underline"
                      onClick={() => navigate("/personas/nuevo")}
                    >
                      Crear nueva persona
                    </Button>
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="personaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>O seleccionar de la lista</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar persona..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {personas.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.numeroDocumento} - {p.nombres} {p.apellidos}
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

          {/* Selección de Curso */}
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Curso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="cursoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Curso *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar curso..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cursosAbiertos.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nombre} ({c.fechaInicio})
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
                name="tipoFormacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Formación *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TIPO_FORMACION_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
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

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/matriculas")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMatricula.isPending}>
              {createMatricula.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Matrícula
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
