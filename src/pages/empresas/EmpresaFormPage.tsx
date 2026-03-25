import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { useEmpresa, useCreateEmpresa, useUpdateEmpresa } from "@/hooks/useEmpresas";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { SECTORES_ECONOMICOS, ARL_OPTIONS } from "@/data/formOptions";

const empresaSchema = z.object({
  nombreEmpresa: z.string().min(2, "Ingrese el nombre de la empresa"),
  nit: z.string().min(5, "Ingrese un NIT válido"),
  representanteLegal: z.string().optional().or(z.literal("")),
  sectorEconomico: z.string().optional().or(z.literal("")),
  arl: z.string().optional().or(z.literal("")),
  direccion: z.string().optional().or(z.literal("")),
  telefonoEmpresa: z.string().optional().or(z.literal("")),
  personaContacto: z.string().optional().or(z.literal("")),
  telefonoContacto: z.string().optional().or(z.literal("")),
  emailContacto: z.string().email("Email inválido").optional().or(z.literal("")),
  activo: z.boolean(),
});

type EmpresaFormSchema = z.infer<typeof empresaSchema>;

export default function EmpresaFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;

  const { data: empresa, isLoading: isLoadingEmpresa } = useEmpresa(id || "");
  const createEmpresa = useCreateEmpresa();
  const updateEmpresa = useUpdateEmpresa();

  const form = useForm<EmpresaFormSchema>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nombreEmpresa: "",
      nit: "",
      representanteLegal: "",
      sectorEconomico: "",
      arl: "",
      direccion: "",
      telefonoEmpresa: "",
      personaContacto: "",
      telefonoContacto: "",
      emailContacto: "",
      activo: true,
    },
  });

  useEffect(() => {
    if (empresa) {
      form.reset({
        nombreEmpresa: empresa.nombreEmpresa,
        nit: empresa.nit,
        representanteLegal: empresa.representanteLegal || "",
        sectorEconomico: empresa.sectorEconomico || "",
        arl: empresa.arl || "",
        direccion: empresa.direccion || "",
        telefonoEmpresa: empresa.telefonoEmpresa || "",
        personaContacto: empresa.personaContacto || "",
        telefonoContacto: empresa.telefonoContacto || "",
        emailContacto: empresa.emailContacto || "",
        activo: empresa.activo,
      });
    }
  }, [empresa, form]);

  const onSubmit = async (data: EmpresaFormSchema) => {
    try {
      const empresaData = {
        nombreEmpresa: data.nombreEmpresa,
        nit: data.nit,
        representanteLegal: data.representanteLegal || "",
        sectorEconomico: data.sectorEconomico || "",
        arl: data.arl || "",
        direccion: data.direccion || "",
        telefonoEmpresa: data.telefonoEmpresa || "",
        personaContacto: data.personaContacto || "",
        telefonoContacto: data.telefonoContacto || "",
        emailContacto: data.emailContacto || "",
        activo: data.activo,
      };

      if (isEditing) {
        await updateEmpresa.mutateAsync({ id, data: empresaData });
        toast({ title: "Empresa actualizada correctamente" });
      } else {
        await createEmpresa.mutateAsync(empresaData);
        toast({ title: "Empresa creada correctamente" });
      }
      navigate("/empresas");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar",
        variant: "destructive",
      });
    }
  };

  const isLoading = createEmpresa.isPending || updateEmpresa.isPending;

  if (isEditing && isLoadingEmpresa) {
    return <div className="flex justify-center py-12">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/empresas")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? "Editar Empresa" : "Nueva Empresa"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Actualiza los datos de la empresa" : "Registra una nueva empresa en el directorio"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombreEmpresa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Empresa *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre legal o comercial" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIT *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="900123456-7" disabled={isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="representanteLegal"
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
              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Dirección principal" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefonoEmpresa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono Empresa</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="6011234567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Estado</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        {field.value ? "Empresa activa en el sistema" : "Empresa inactiva"}
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datos de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="personaContacto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Persona de Contacto</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre completo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefonoContacto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono Contacto</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="3001234567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emailContacto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Contacto</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} placeholder="contacto@empresa.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/empresas")}>
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
