import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, Search, UserPlus, Building2, User as UserIcon, Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Combobox } from "@/components/ui/combobox";
import { useSearchPersonas } from "@/hooks/usePersonas";
import { useCursos } from "@/hooks/useCursos";
import { useCreateMatricula, useHistorialByPersona } from "@/hooks/useMatriculas";
import { useToast } from "@/hooks/use-toast";
import { TIPO_FORMACION_LABELS } from "@/types";
import { useState, useEffect } from "react";
import { CrearPersonaModal } from "@/components/matriculas/CrearPersonaModal";
import { Persona } from "@/types/persona";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  NIVELES_PREVIOS,
  TIPOS_VINCULACION,
  NIVELES_FORMACION_EMPRESA,
  AREAS_TRABAJO,
  SECTORES_ECONOMICOS,
} from "@/data/formOptions";

const matriculaSchema = z.object({
  personaId: z.string().min(1, "Seleccione una persona"),
  cursoId: z.string().optional(),
  tipoFormacion: z.enum(["inicial", "reentrenamiento", "avanzado", "coordinador"]),
  // Historial
  nivelPrevio: z.string().optional(),
  centroFormacionPrevio: z.string().optional(),
  fechaCertificacionPrevia: z.string().optional(),
  // Vinculación laboral
  tipoVinculacion: z.string().optional(),
  empresaNombre: z.string().optional(),
  empresaNit: z.string().optional(),
  empresaRepresentanteLegal: z.string().optional(),
  empresaCargo: z.string().optional(),
  empresaNivelFormacion: z.string().optional(),
  empresaContactoNombre: z.string().optional(),
  empresaContactoTelefono: z.string().optional(),
  areaTrabajo: z.string().optional(),
  sectorEconomico: z.string().optional(),
});

type MatriculaFormData = z.infer<typeof matriculaSchema>;

export default function MatriculaFormPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [crearPersonaOpen, setCrearPersonaOpen] = useState(false);

  const { data: searchResults = [], isFetching: isSearching } = useSearchPersonas(searchQuery);
  const { data: cursos = [] } = useCursos();
  const createMatricula = useCreateMatricula();

  const form = useForm<MatriculaFormData>({
    resolver: zodResolver(matriculaSchema),
    defaultValues: {
      personaId: "",
      cursoId: "",
      tipoFormacion: "inicial",
      nivelPrevio: "",
      centroFormacionPrevio: "",
      fechaCertificacionPrevia: "",
      tipoVinculacion: "",
      empresaNombre: "",
      empresaNit: "",
      empresaRepresentanteLegal: "",
      empresaCargo: "",
      empresaNivelFormacion: "",
      empresaContactoNombre: "",
      empresaContactoTelefono: "",
      areaTrabajo: "",
      sectorEconomico: "",
    },
  });

  const personaId = form.watch("personaId");
  const cursoId = form.watch("cursoId");
  const tipoVinculacion = form.watch("tipoVinculacion");

  const { data: historial } = useHistorialByPersona(personaId);
  const selectedCurso = cursos.find((c) => c.id === cursoId);
  const cursosAbiertos = cursos.filter((c) => c.estado !== "cerrado");

  // Autocompletar historial cuando se encuentra
  useEffect(() => {
    if (historial) {
      if (historial.nivelPrevio && !form.getValues("nivelPrevio")) {
        form.setValue("nivelPrevio", historial.nivelPrevio);
      }
      if (historial.centroFormacionPrevio && !form.getValues("centroFormacionPrevio")) {
        form.setValue("centroFormacionPrevio", historial.centroFormacionPrevio);
      }
      if (historial.fechaCertificacionPrevia && !form.getValues("fechaCertificacionPrevia")) {
        form.setValue("fechaCertificacionPrevia", historial.fechaCertificacionPrevia);
      }
    }
  }, [historial, form]);

  const handleSelectPersona = (persona: Persona) => {
    setSelectedPersona(persona);
    form.setValue("personaId", persona.id);
    setSearchQuery("");
  };

  const handlePersonaCreated = (id: string) => {
    // Re-fetch will happen via query invalidation, but we set the ID immediately
    form.setValue("personaId", id);
    // We need to find the persona from the search results after invalidation
    // For now, clear search and show a success state
    setSearchQuery("");
  };

  const onSubmit = async (data: MatriculaFormData) => {
    try {
      await createMatricula.mutateAsync({
        personaId: data.personaId,
        cursoId: data.cursoId || '',
        tipoFormacion: data.tipoFormacion,
        nivelPrevio: (data.nivelPrevio as any) || undefined,
        centroFormacionPrevio: data.centroFormacionPrevio || undefined,
        fechaCertificacionPrevia: data.fechaCertificacionPrevia || undefined,
        tipoVinculacion: (data.tipoVinculacion as any) || undefined,
        empresaNombre: data.empresaNombre || undefined,
        empresaNit: data.empresaNit || undefined,
        empresaRepresentanteLegal: data.empresaRepresentanteLegal || undefined,
        empresaCargo: data.empresaCargo || undefined,
        empresaNivelFormacion: (data.empresaNivelFormacion as any) || undefined,
        empresaContactoNombre: data.empresaContactoNombre || undefined,
        empresaContactoTelefono: data.empresaContactoTelefono || undefined,
        areaTrabajo: data.areaTrabajo || undefined,
        sectorEconomico: data.sectorEconomico || undefined,
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
          {/* Sección 1: Búsqueda de Estudiante */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Estudiante
              </CardTitle>
              <CardDescription>
                Busca por número de documento, nombre o apellido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por documento, nombre o apellido..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 max-w-md"
                />
              </div>

              {/* Resultados de búsqueda */}
              {searchQuery.length >= 2 && (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Buscando...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-center gap-3"
                        onClick={() => handleSelectPersona(p)}
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{p.nombres} {p.apellidos}</p>
                          <p className="text-xs text-muted-foreground">{p.tipoDocumento}: {p.numeroDocumento}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        No encontramos a esta persona en el sistema
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCrearPersonaOpen(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Crear persona
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Persona seleccionada */}
              {selectedPersona && (
                <div className="p-4 bg-muted/50 rounded-lg flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Estudiante seleccionado</p>
                    <p className="font-semibold">{selectedPersona.nombres} {selectedPersona.apellidos}</p>
                    <p className="text-sm text-muted-foreground">{selectedPersona.tipoDocumento}: {selectedPersona.numeroDocumento}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPersona(null);
                      form.setValue("personaId", "");
                    }}
                  >
                    Cambiar
                  </Button>
                </div>
              )}

              {/* Persona ID set but no persona object (e.g. just created) */}
              {personaId && !selectedPersona && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm text-emerald-700 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Persona seleccionada correctamente
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="personaId"
                render={() => (
                  <FormItem className="hidden">
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Sección 2: Curso (opcional) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Curso
              </CardTitle>
              <CardDescription>
                Opcional — puedes asignar un curso después
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="cursoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Curso</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar curso (opcional)..." />
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

              {selectedCurso && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha de Inicio</p>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedCurso.fechaInicio), "d 'de' MMMM yyyy", { locale: es })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha de Fin</p>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedCurso.fechaFin), "d 'de' MMMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
              )}

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

          {/* Sección 3: Historial de Formación Previa */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Formación Previa</CardTitle>
              <CardDescription>
                {historial
                  ? "Se encontró historial previo — los datos se autocompletaron"
                  : "Si la persona tiene formación previa, ingresa los datos aquí"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="nivelPrevio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nivel Previo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {NIVELES_PREVIOS.map((n) => (
                            <SelectItem key={n.value} value={n.value}>
                              {n.label}
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
                  name="centroFormacionPrevio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Centro de Formación</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nombre del centro o código del curso" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fechaCertificacionPrevia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Certificación</FormLabel>
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

          {/* Sección 4: Vinculación Laboral */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Vinculación Laboral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="tipoVinculacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Vinculación</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIPOS_VINCULACION.map((t) => (
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
                  name="areaTrabajo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área de Trabajo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AREAS_TRABAJO.map((a) => (
                            <SelectItem key={a.value} value={a.value}>
                              {a.label}
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
                  name="sectorEconomico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sector Económico</FormLabel>
                      <FormControl>
                        <Combobox
                          options={SECTORES_ECONOMICOS}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Seleccionar sector..."
                          searchPlaceholder="Buscar sector..."
                          emptyMessage="Sector no encontrado"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Campos de empresa (solo si tipoVinculacion === 'empresa') */}
              {tipoVinculacion === "empresa" && (
                <div className="space-y-4 pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground pt-2">Datos de la Empresa</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="empresaNombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la Empresa</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nombre de la empresa" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="empresaNit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIT</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="900123456-1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="empresaRepresentanteLegal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Representante Legal</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nombre completo" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="empresaCargo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Cargo del estudiante" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="empresaNivelFormacion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nivel de Formación</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {NIVELES_FORMACION_EMPRESA.map((n) => (
                                <SelectItem key={n.value} value={n.value}>
                                  {n.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <p className="text-sm font-medium text-muted-foreground pt-2">Persona de Contacto</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="empresaContactoNombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de Contacto</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nombre completo" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="empresaContactoTelefono"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono de Contacto</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="3001234567" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
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

      <CrearPersonaModal
        open={crearPersonaOpen}
        onOpenChange={setCrearPersonaOpen}
        onPersonaCreated={handlePersonaCreated}
      />
    </div>
  );
}
