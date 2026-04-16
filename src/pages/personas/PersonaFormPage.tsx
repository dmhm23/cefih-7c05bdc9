import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BirthDateField } from "@/components/shared/BirthDateField";
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
import { usePersona, useCreatePersona, useUpdatePersona } from "@/hooks/usePersonas";
import { useToast } from "@/hooks/use-toast";
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { useEffect } from "react";
import {
  TIPOS_DOCUMENTO,
  GENEROS,
  PAISES,
  NIVELES_EDUCATIVOS,
  GRUPOS_SANGUINEOS,
} from "@/data/formOptions";

const personaSchema = z.object({
  // Identificación
  tipoDocumento: z.enum(['CC', 'CE', 'PA', 'PE', 'PP'], { required_error: "Seleccione el tipo" }),
  numeroDocumento: z.string().min(6, "Mínimo 6 caracteres"),
  
  // Datos personales
  nombres: z.string().min(2, "Ingrese el nombre"),
  apellidos: z.string().min(2, "Ingrese los apellidos"),
  genero: z.enum(['M', 'F', 'O'], { required_error: "Seleccione el género" }),
  paisNacimiento: z.string().min(1, "Seleccione el país"),
  fechaNacimiento: z.string().min(1, "Seleccione la fecha"),
  rh: z.string().min(1, "Seleccione el RH"),
  
  // Datos laborales/educativos
  nivelEducativo: z.string().min(1, "Seleccione el nivel"),
  
  // Contacto
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().min(7, "Teléfono inválido"),
  
  // Contacto de emergencia
  contactoEmergenciaNombre: z.string().min(2, "Ingrese el nombre"),
  contactoEmergenciaTelefono: z.string().min(7, "Teléfono inválido"),
  contactoEmergenciaParentesco: z.string().min(2, "Ingrese el parentesco"),
});

type PersonaFormDataSchema = z.infer<typeof personaSchema>;

export default function PersonaFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const isEditing = !!id;

  const { data: persona, isLoading: isLoadingPersona } = usePersona(id || "");
  const createPersona = useCreatePersona();
  const updatePersona = useUpdatePersona();

  const form = useForm<PersonaFormDataSchema>({
    resolver: zodResolver(personaSchema),
    defaultValues: {
      tipoDocumento: 'CC',
      numeroDocumento: "",
      nombres: "",
      apellidos: "",
      genero: 'M',
      paisNacimiento: "CO",
      fechaNacimiento: "",
      rh: "",
      nivelEducativo: "",
      email: "",
      telefono: "",
      contactoEmergenciaNombre: "",
      contactoEmergenciaTelefono: "",
      contactoEmergenciaParentesco: "",
    },
  });

  useEffect(() => {
    if (persona) {
      form.reset({
        tipoDocumento: persona.tipoDocumento,
        numeroDocumento: persona.numeroDocumento,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        genero: persona.genero,
        paisNacimiento: persona.paisNacimiento,
        fechaNacimiento: persona.fechaNacimiento,
        rh: persona.rh,
        nivelEducativo: persona.nivelEducativo,
        email: persona.email,
        telefono: persona.telefono,
        contactoEmergenciaNombre: persona.contactoEmergencia.nombre,
        contactoEmergenciaTelefono: persona.contactoEmergencia.telefono,
        contactoEmergenciaParentesco: persona.contactoEmergencia.parentesco,
      });
    }
  }, [persona, form]);

  const onSubmit = async (data: PersonaFormDataSchema) => {
    try {
      const personaData = {
        tipoDocumento: data.tipoDocumento,
        numeroDocumento: data.numeroDocumento,
        nombres: data.nombres,
        apellidos: data.apellidos,
        genero: data.genero,
        paisNacimiento: data.paisNacimiento,
        fechaNacimiento: data.fechaNacimiento,
        rh: data.rh,
        nivelEducativo: data.nivelEducativo as any,
        email: data.email,
        telefono: data.telefono,
        contactoEmergencia: {
          nombre: data.contactoEmergenciaNombre,
          telefono: data.contactoEmergenciaTelefono,
          parentesco: data.contactoEmergenciaParentesco,
        },
      };

      if (isEditing) {
        await updatePersona.mutateAsync({ id, data: personaData });
        toast({ title: "Persona actualizada correctamente" });
        logActivity({ action: "editar", module: "personas", description: `Editó persona ${data.nombres} ${data.apellidos}`, entityType: "persona", entityId: id });
      } else {
        await createPersona.mutateAsync(personaData);
        toast({ title: "Persona creada correctamente" });
        logActivity({ action: "crear", module: "personas", description: `Creó persona ${data.nombres} ${data.apellidos}`, entityType: "persona" });
      }
      navigate("/personas");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar",
        variant: "destructive",
      });
    }
  };

  const isLoading = createPersona.isPending || updatePersona.isPending;

  if (isEditing && isLoadingPersona) {
    return <div className="flex justify-center py-12">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <IconButton tooltip="Volver" onClick={() => navigate("/personas")}>
          <ArrowLeft className="h-4 w-4" />
        </IconButton>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? "Editar Persona" : "Nueva Persona"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Actualiza los datos de la persona" : "Registra una nueva persona en el sistema"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Datos Personales */}
          <Card>
            <CardHeader>
              <CardTitle>Datos Personales</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de Documento */}
              <FormField
                control={form.control}
                name="tipoDocumento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Documento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPOS_DOCUMENTO.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Número de Documento */}
              <FormField
                control={form.control}
                name="numeroDocumento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. Documento *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="1234567890" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nombres */}
              <FormField
                control={form.control}
                name="nombres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombres *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Juan Carlos" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Apellidos */}
              <FormField
                control={form.control}
                name="apellidos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellidos *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Rodríguez Pérez" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Género */}
              <FormField
                control={form.control}
                name="genero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Género *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENEROS.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* País de Nacimiento */}
              <FormField
                control={form.control}
                name="paisNacimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País de Nacimiento *</FormLabel>
                    <FormControl>
                      <Combobox
                        options={PAISES}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar país..."
                        searchPlaceholder="Buscar país..."
                        emptyMessage="País no encontrado"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha de Nacimiento */}
              <FormField
                control={form.control}
                name="fechaNacimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Nacimiento *</FormLabel>
                    <FormControl>
                      <BirthDateField value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* RH */}
              <FormField
                control={form.control}
                name="rh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RH *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GRUPOS_SANGUINEOS.map((rh) => (
                          <SelectItem key={rh.value} value={rh.value}>
                            {rh.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nivel Educativo */}
              <FormField
                control={form.control}
                name="nivelEducativo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel Educativo *</FormLabel>
                    <FormControl>
                      <Combobox
                        options={NIVELES_EDUCATIVOS}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar nivel..."
                        searchPlaceholder="Buscar nivel..."
                        emptyMessage="Nivel no encontrado"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </CardContent>
          </Card>

          {/* Datos de Contacto */}
          <Card>
            <CardHeader>
              <CardTitle>Datos de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="3001234567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} placeholder="correo@email.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contacto de Emergencia */}
          <Card>
            <CardHeader>
              <CardTitle>Contacto de Emergencia</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="contactoEmergenciaNombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre completo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactoEmergenciaTelefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="3001234567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactoEmergenciaParentesco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parentesco *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Esposo/a, Hermano/a, etc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/personas")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Actualizar" : "Guardar"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}