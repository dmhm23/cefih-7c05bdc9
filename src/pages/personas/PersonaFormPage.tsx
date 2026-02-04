import { useParams, useNavigate } from "react-router-dom";
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
import { usePersona, useCreatePersona, useUpdatePersona } from "@/hooks/usePersonas";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const personaSchema = z.object({
  cedula: z.string().min(6, "La cédula debe tener al menos 6 caracteres"),
  nombres: z.string().min(2, "Ingrese el nombre"),
  apellidos: z.string().min(2, "Ingrese los apellidos"),
  email: z.string().email("Email inválido"),
  telefono: z.string().min(7, "Teléfono inválido"),
  fechaNacimiento: z.string().min(1, "Seleccione la fecha"),
  direccion: z.string().min(5, "Ingrese la dirección"),
  eps: z.string().min(2, "Ingrese la EPS"),
  arl: z.string().min(2, "Ingrese la ARL"),
  contactoEmergenciaNombre: z.string().min(2, "Ingrese el nombre"),
  contactoEmergenciaTelefono: z.string().min(7, "Teléfono inválido"),
  contactoEmergenciaParentesco: z.string().min(2, "Ingrese el parentesco"),
});

type PersonaFormData = z.infer<typeof personaSchema>;

export default function PersonaFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;

  const { data: persona, isLoading: isLoadingPersona } = usePersona(id || "");
  const createPersona = useCreatePersona();
  const updatePersona = useUpdatePersona();

  const form = useForm<PersonaFormData>({
    resolver: zodResolver(personaSchema),
    defaultValues: {
      cedula: "",
      nombres: "",
      apellidos: "",
      email: "",
      telefono: "",
      fechaNacimiento: "",
      direccion: "",
      eps: "",
      arl: "",
      contactoEmergenciaNombre: "",
      contactoEmergenciaTelefono: "",
      contactoEmergenciaParentesco: "",
    },
  });

  useEffect(() => {
    if (persona) {
      form.reset({
        cedula: persona.cedula,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        email: persona.email,
        telefono: persona.telefono,
        fechaNacimiento: persona.fechaNacimiento,
        direccion: persona.direccion,
        eps: persona.eps,
        arl: persona.arl,
        contactoEmergenciaNombre: persona.contactoEmergencia.nombre,
        contactoEmergenciaTelefono: persona.contactoEmergencia.telefono,
        contactoEmergenciaParentesco: persona.contactoEmergencia.parentesco,
      });
    }
  }, [persona, form]);

  const onSubmit = async (data: PersonaFormData) => {
    try {
      const personaData = {
        cedula: data.cedula,
        nombres: data.nombres,
        apellidos: data.apellidos,
        email: data.email,
        telefono: data.telefono,
        fechaNacimiento: data.fechaNacimiento,
        direccion: data.direccion,
        eps: data.eps,
        arl: data.arl,
        contactoEmergencia: {
          nombre: data.contactoEmergenciaNombre,
          telefono: data.contactoEmergenciaTelefono,
          parentesco: data.contactoEmergenciaParentesco,
        },
      };

      if (isEditing) {
        await updatePersona.mutateAsync({ id, data: personaData });
        toast({ title: "Persona actualizada correctamente" });
      } else {
        await createPersona.mutateAsync(personaData);
        toast({ title: "Persona creada correctamente" });
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
        <Button variant="ghost" size="icon" onClick={() => navigate("/personas")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
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
          <Card>
            <CardHeader>
              <CardTitle>Datos Personales</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cedula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cédula *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isEditing} placeholder="1234567890" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fechaNacimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Nacimiento *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} placeholder="correo@email.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                name="direccion"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Dirección *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Calle 123 #45-67, Ciudad" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seguridad Social</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="eps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EPS *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre de la EPS" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="arl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ARL *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre de la ARL" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

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
                      <Input {...field} placeholder="Esposo/a, Padre, Madre..." />
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
                  {isEditing ? "Actualizar" : "Crear Persona"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
