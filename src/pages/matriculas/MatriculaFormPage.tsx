import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, Search, UserPlus, Building2, User as UserIcon, Calendar, Info, HeartPulse, ShieldCheck, ChevronDown, ChevronUp, FileText, UserCircle, Globe, Droplet, GraduationCap, Mail, Phone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { useSearchPersonas, useUpdatePersona } from "@/hooks/usePersonas";
import { useCursos } from "@/hooks/useCursos";
import { useCreateMatricula, useHistorialByPersona } from "@/hooks/useMatriculas";
import { useToast } from "@/hooks/use-toast";
import { useNivelesFormacion } from "@/hooks/useNivelesFormacion";
import { useState, useEffect } from "react";
import { CrearPersonaModal } from "@/components/matriculas/CrearPersonaModal";
import { ConsentimientoSalud } from "@/components/matriculas/ConsentimientoSalud";
import { Persona, PersonaFormData } from "@/types/persona";
import { EditableField } from "@/components/shared/EditableField";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  NIVELES_PREVIOS,
  TIPOS_VINCULACION,
  AREAS_TRABAJO,
  SECTORES_ECONOMICOS,
  TIPOS_DOCUMENTO,
  GENEROS,
  NIVELES_EDUCATIVOS,
  GRUPOS_SANGUINEOS,
  PAISES,
  EPS_OPTIONS,
  ARL_OPTIONS,
} from "@/data/formOptions";

const matriculaSchema = z.object({
  personaId: z.string().min(1, "Seleccione una persona"),
  cursoId: z.string().optional(),
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
  eps: z.string().optional(),
  epsOtra: z.string().optional(),
  arl: z.string().optional(),
  arlOtra: z.string().optional(),
  // Consentimiento de salud
  consentimientoSalud: z.boolean().default(false),
  restriccionMedica: z.boolean().default(false),
  restriccionMedicaDetalle: z.string().optional(),
  alergias: z.boolean().default(false),
  alergiasDetalle: z.string().optional(),
  consumoMedicamentos: z.boolean().default(false),
  consumoMedicamentosDetalle: z.string().optional(),
  embarazo: z.boolean().optional(),
  nivelLectoescritura: z.boolean().default(true),
  // Autorización de datos
  autorizacionDatos: z.boolean().default(true),
});

type MatriculaFormData = z.infer<typeof matriculaSchema>;

export default function MatriculaFormPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [crearPersonaOpen, setCrearPersonaOpen] = useState(false);
  const [showPersonaDetails, setShowPersonaDetails] = useState(false);
  const [personaFormData, setPersonaFormData] = useState<Partial<PersonaFormData>>({});
  const [personaIsDirty, setPersonaIsDirty] = useState(false);

  const { data: searchResults = [], isFetching: isSearching } = useSearchPersonas(searchQuery);
  const { data: cursos = [] } = useCursos();
  const { data: nivelesFormacion = [] } = useNivelesFormacion();
  const createMatricula = useCreateMatricula();
  const updatePersona = useUpdatePersona();

  const nivelesOptions = nivelesFormacion.map((n) => ({
    value: n.id,
    label: n.nombreNivel,
  }));

  const form = useForm<MatriculaFormData>({
    resolver: zodResolver(matriculaSchema),
    defaultValues: {
      personaId: "",
      cursoId: "",
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
      eps: "",
      epsOtra: "",
      arl: "",
      arlOtra: "",
      consentimientoSalud: false,
      restriccionMedica: false,
      restriccionMedicaDetalle: "",
      alergias: false,
      alergiasDetalle: "",
      consumoMedicamentos: false,
      consumoMedicamentosDetalle: "",
      embarazo: false,
      nivelLectoescritura: true,
      autorizacionDatos: true,
    },
  });

  const personaId = form.watch("personaId");
  const cursoId = form.watch("cursoId");
  const tipoVinculacion = form.watch("tipoVinculacion");

  const { data: historial } = useHistorialByPersona(personaId);
  const selectedCurso = cursos.find((c) => c.id === cursoId);
  const cursosAbiertos = cursos.filter((c) => c.estado !== "cerrado");

  // Auto-completar datos de empresa para independientes
  useEffect(() => {
    if (tipoVinculacion === "independiente" && selectedPersona) {
      const nombreCompleto = `${selectedPersona.nombres} ${selectedPersona.apellidos}`;
      form.setValue("empresaNombre", nombreCompleto);
      form.setValue("empresaNit", selectedPersona.numeroDocumento);
      form.setValue("empresaRepresentanteLegal", nombreCompleto);
    } else if (tipoVinculacion === "empresa") {
      form.setValue("empresaNombre", "");
      form.setValue("empresaNit", "");
      form.setValue("empresaRepresentanteLegal", "");
    }
  }, [tipoVinculacion, selectedPersona, form]);

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
    setPersonaFormData({});
    setPersonaIsDirty(false);
    setShowPersonaDetails(false);
  };

  // Persona inline editing helpers
  const handlePersonaFieldChange = (field: keyof PersonaFormData, value: string) => {
    setPersonaFormData((prev) => ({ ...prev, [field]: value }));
    setPersonaIsDirty(true);
  };

  const handlePersonaNestedChange = (parent: "contactoEmergencia", field: string, value: string) => {
    if (!selectedPersona) return;
    setPersonaFormData((prev) => ({
      ...prev,
      [parent]: {
        ...selectedPersona[parent],
        ...(prev[parent] as object || {}),
        [field]: value,
      },
    }));
    setPersonaIsDirty(true);
  };

  const getPersonaValue = <K extends keyof Persona>(field: K): Persona[K] => {
    if (!selectedPersona) return "" as Persona[K];
    return (personaFormData[field as keyof PersonaFormData] as Persona[K]) ?? selectedPersona[field];
  };

  const getDisplayLabel = (value: string, options: readonly { value: string; label: string }[]) => {
    return options.find((o) => o.value === value)?.label || value;
  };

  const handlePersonaSave = async () => {
    if (!selectedPersona) return;
    try {
      await updatePersona.mutateAsync({ id: selectedPersona.id, data: personaFormData });
      // Update local selectedPersona with new data
      setSelectedPersona({ ...selectedPersona, ...personaFormData } as Persona);
      setPersonaFormData({});
      setPersonaIsDirty(false);
      toast({ title: "Datos del estudiante actualizados" });
    } catch {
      toast({ title: "Error al guardar datos del estudiante", variant: "destructive" });
    }
  };

  const handlePersonaCancel = () => {
    setPersonaFormData({});
    setPersonaIsDirty(false);
  };

  const handlePersonaCreated = async (id: string) => {
    form.setValue("personaId", id);
    setSearchQuery("");
    // Fetch the newly created persona to display their info
    try {
      const { personaService } = await import("@/services/personaService");
      const persona = await personaService.getById(id);
      if (persona) {
        setSelectedPersona(persona);
      }
    } catch {
      // ID is already set, worst case shows fallback
    }
  };

  const onSubmit = async (data: MatriculaFormData) => {
    try {
      await createMatricula.mutateAsync({
        personaId: data.personaId,
        cursoId: data.cursoId || '',
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
        eps: data.eps || undefined,
        epsOtra: data.eps === 'otra_eps' ? data.epsOtra || undefined : undefined,
        arl: data.arl || undefined,
        arlOtra: data.arl === 'otra_arl' ? data.arlOtra || undefined : undefined,
        consentimientoSalud: data.consentimientoSalud,
        restriccionMedica: data.restriccionMedica,
        restriccionMedicaDetalle: data.restriccionMedicaDetalle || undefined,
        alergias: data.alergias,
        alergiasDetalle: data.alergiasDetalle || undefined,
        consumoMedicamentos: data.consumoMedicamentos,
        consumoMedicamentosDetalle: data.consumoMedicamentosDetalle || undefined,
        embarazo: data.embarazo || undefined,
        nivelLectoescritura: data.nivelLectoescritura,
        autorizacionDatos: data.autorizacionDatos,
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
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/matriculas")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva Matrícula</h1>
          <p className="text-sm text-muted-foreground">Inscribir estudiante a un curso</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Sección 1: Búsqueda de Estudiante */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" />
                Buscar Estudiante
              </CardTitle>
              <CardDescription className="text-xs">
                Busca por número de documento, nombre o apellido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por documento, nombre o apellido..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="button" variant="outline" size="default" onClick={() => setCrearPersonaOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear persona
                </Button>
              </div>

              {searchQuery.length >= 2 && (
                <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-2.5 text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Buscando...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-center gap-3"
                        onClick={() => handleSelectPersona(p)}
                      >
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <UserIcon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.nombres} {p.apellidos}</p>
                          <p className="text-xs text-muted-foreground">{p.tipoDocumento}: {p.numeroDocumento}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center space-y-1.5">
                      <p className="text-sm text-muted-foreground">
                        No encontramos a esta persona en el sistema
                      </p>
                      <Button type="button" variant="outline" size="sm" onClick={() => setCrearPersonaOpen(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Crear persona
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {selectedPersona && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <UserIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Estudiante seleccionado</p>
                      <p className="font-semibold text-sm">{getPersonaValue("nombres")} {getPersonaValue("apellidos")}</p>
                      <p className="text-xs text-muted-foreground">{getPersonaValue("tipoDocumento")}: {getPersonaValue("numeroDocumento")}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPersonaDetails(!showPersonaDetails)}
                    >
                      {showPersonaDetails ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                      {showPersonaDetails ? "Ocultar" : "Ver datos"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSelectedPersona(null); form.setValue("personaId", ""); setShowPersonaDetails(false); setPersonaFormData({}); setPersonaIsDirty(false); }}
                    >
                      Cambiar
                    </Button>
                  </div>

                  {showPersonaDetails && (
                    <div className="space-y-3 border rounded-lg p-4">
                      {/* Datos Personales */}
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Datos Personales</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <EditableField
                          label="Tipo de Documento"
                          value={getPersonaValue("tipoDocumento")}
                          displayValue={getDisplayLabel(getPersonaValue("tipoDocumento"), TIPOS_DOCUMENTO)}
                          onChange={(v) => handlePersonaFieldChange("tipoDocumento", v)}
                          type="select"
                          options={[...TIPOS_DOCUMENTO]}
                          icon={FileText}
                          badge
                        />
                        <EditableField
                          label="Número de Documento"
                          value={getPersonaValue("numeroDocumento")}
                          onChange={(v) => handlePersonaFieldChange("numeroDocumento", v)}
                          icon={FileText}
                        />
                        <EditableField
                          label="Nombres"
                          value={getPersonaValue("nombres")}
                          onChange={(v) => handlePersonaFieldChange("nombres", v)}
                          icon={UserIcon}
                        />
                        <EditableField
                          label="Apellidos"
                          value={getPersonaValue("apellidos")}
                          onChange={(v) => handlePersonaFieldChange("apellidos", v)}
                          icon={UserIcon}
                        />
                        <EditableField
                          label="Género"
                          value={getPersonaValue("genero")}
                          displayValue={getDisplayLabel(getPersonaValue("genero"), GENEROS)}
                          onChange={(v) => handlePersonaFieldChange("genero", v)}
                          type="select"
                          options={[...GENEROS]}
                          icon={UserCircle}
                          badge
                        />
                        <EditableField
                          label="País de Nacimiento"
                          value={getPersonaValue("paisNacimiento")}
                          displayValue={getDisplayLabel(getPersonaValue("paisNacimiento"), PAISES)}
                          onChange={(v) => handlePersonaFieldChange("paisNacimiento", v)}
                          type="select"
                          options={[...PAISES]}
                          icon={Globe}
                        />
                        <EditableField
                          label="Fecha de Nacimiento"
                          value={getPersonaValue("fechaNacimiento")}
                          onChange={(v) => handlePersonaFieldChange("fechaNacimiento", v)}
                          type="date"
                          icon={Calendar}
                        />
                        <EditableField
                          label="Grupo Sanguíneo"
                          value={getPersonaValue("rh")}
                          displayValue={getDisplayLabel(getPersonaValue("rh"), GRUPOS_SANGUINEOS)}
                          onChange={(v) => handlePersonaFieldChange("rh", v)}
                          type="select"
                          options={[...GRUPOS_SANGUINEOS]}
                          icon={Droplet}
                          badge
                          badgeVariant="outline"
                        />
                        <EditableField
                          label="Nivel Educativo"
                          value={getPersonaValue("nivelEducativo")}
                          displayValue={getDisplayLabel(getPersonaValue("nivelEducativo"), NIVELES_EDUCATIVOS)}
                          onChange={(v) => handlePersonaFieldChange("nivelEducativo", v)}
                          type="select"
                          options={[...NIVELES_EDUCATIVOS]}
                          icon={GraduationCap}
                        />
                      </div>

                      {/* Datos de Contacto */}
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2">Datos de Contacto</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <EditableField
                          label="Email"
                          value={getPersonaValue("email")}
                          onChange={(v) => handlePersonaFieldChange("email", v)}
                          icon={Mail}
                        />
                        <EditableField
                          label="Teléfono"
                          value={getPersonaValue("telefono")}
                          onChange={(v) => handlePersonaFieldChange("telefono", v)}
                          icon={Phone}
                        />
                      </div>

                      {/* Contacto de Emergencia */}
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2">Contacto de Emergencia</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <EditableField
                          label="Nombre"
                          value={
                            (personaFormData.contactoEmergencia as PersonaFormData["contactoEmergencia"])?.nombre ??
                            selectedPersona.contactoEmergencia.nombre
                          }
                          onChange={(v) => handlePersonaNestedChange("contactoEmergencia", "nombre", v)}
                          icon={AlertCircle}
                        />
                        <EditableField
                          label="Teléfono"
                          value={
                            (personaFormData.contactoEmergencia as PersonaFormData["contactoEmergencia"])?.telefono ??
                            selectedPersona.contactoEmergencia.telefono
                          }
                          onChange={(v) => handlePersonaNestedChange("contactoEmergencia", "telefono", v)}
                          icon={Phone}
                        />
                        <EditableField
                          label="Parentesco"
                          value={
                            (personaFormData.contactoEmergencia as PersonaFormData["contactoEmergencia"])?.parentesco ??
                            selectedPersona.contactoEmergencia.parentesco
                          }
                          onChange={(v) => handlePersonaNestedChange("contactoEmergencia", "parentesco", v)}
                          icon={UserIcon}
                        />
                      </div>

                      {/* Guardar/Cancelar cambios de persona */}
                      {personaIsDirty && (
                        <div className="flex justify-end gap-2 pt-2 border-t">
                          <Button type="button" variant="outline" size="sm" onClick={handlePersonaCancel}>
                            Cancelar
                          </Button>
                          <Button type="button" size="sm" onClick={handlePersonaSave} disabled={updatePersona.isPending}>
                            {updatePersona.isPending ? "Guardando..." : "Guardar Datos Personales"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {personaId && !selectedPersona && (
                <div className="p-3 bg-muted/30 border rounded-lg">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Persona seleccionada correctamente
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="personaId"
                render={() => <FormItem className="hidden"><FormMessage /></FormItem>}
              />
            </CardContent>
          </Card>

          {/* Sección 2: Curso + Tipo Formación */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Curso
              </CardTitle>
              <CardDescription className="text-xs">
                Opcional — puedes asignar un curso después
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {selectedCurso && (
                <div className="grid grid-cols-2 gap-4 p-2.5 bg-muted/50 rounded-lg">
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
            </CardContent>
          </Card>


          {/* Sección 3: Vinculación Laboral */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Vinculación Laboral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
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
                      <FormControl>
                        <Combobox
                          options={nivelesOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Seleccionar nivel..."
                          searchPlaceholder="Buscar nivel..."
                          emptyMessage="No se encontraron niveles."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="eps"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>EPS</FormLabel>
                      <FormControl>
                        <Combobox
                          options={EPS_OPTIONS}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Seleccionar EPS..."
                          searchPlaceholder="Buscar EPS..."
                          emptyMessage="EPS no encontrada"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("eps") === "otra_eps" && (
                  <FormField
                    control={form.control}
                    name="epsOtra"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la EPS</FormLabel>
                        <FormControl>
                          <Input placeholder="Escriba el nombre de la EPS..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="arl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ARL</FormLabel>
                      <FormControl>
                        <Combobox
                          options={ARL_OPTIONS}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Seleccionar ARL..."
                          searchPlaceholder="Buscar ARL..."
                          emptyMessage="ARL no encontrada"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("arl") === "otra_arl" && (
                  <FormField
                    control={form.control}
                    name="arlOtra"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la ARL</FormLabel>
                        <FormControl>
                          <Input placeholder="Escriba el nombre de la ARL..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {(tipoVinculacion === "empresa" || tipoVinculacion === "independiente" || tipoVinculacion === "arl") && (
                <div className="space-y-3 pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground pt-1">Datos de la Empresa</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  </div>
                  {(tipoVinculacion === "empresa" || tipoVinculacion === "arl") && (
                    <>
                      <p className="text-sm font-medium text-muted-foreground pt-1">Persona de Contacto</p>
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
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sección 4: Historial de Formación Previa */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base">Historial de Formación Previa</CardTitle>
              <CardDescription className="text-xs">
                {historial
                  ? "Se encontró historial previo — los datos se autocompletaron"
                  : "Si la persona tiene formación previa, ingresa los datos aquí"}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
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
                        <Input {...field} placeholder="Nombre del centro o código" />
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
                        <DateField value={field.value || ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sección 5: Consentimiento de Salud */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <HeartPulse className="h-4 w-4" />
                Consentimiento de Salud
              </CardTitle>
              <CardDescription className="text-xs">
                Información médica relevante para el curso
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ConsentimientoSalud
                data={{
                  consentimientoSalud: form.watch("consentimientoSalud"),
                  restriccionMedica: form.watch("restriccionMedica"),
                  restriccionMedicaDetalle: form.watch("restriccionMedicaDetalle"),
                  alergias: form.watch("alergias"),
                  alergiasDetalle: form.watch("alergiasDetalle"),
                  consumoMedicamentos: form.watch("consumoMedicamentos"),
                  consumoMedicamentosDetalle: form.watch("consumoMedicamentosDetalle"),
                  embarazo: form.watch("embarazo"),
                  nivelLectoescritura: form.watch("nivelLectoescritura"),
                }}
                onChange={(field, value) => form.setValue(field as any, value, { shouldDirty: true })}
                showEmbarazo={selectedPersona?.genero === 'F'}
              />
            </CardContent>
          </Card>


          <div className="flex justify-end gap-3 pb-4">
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
