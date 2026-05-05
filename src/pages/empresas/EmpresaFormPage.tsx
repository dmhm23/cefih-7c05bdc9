import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, Plus, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { useEffect, useState } from "react";
import { SECTORES_ECONOMICOS, ARL_OPTIONS } from "@/data/formOptions";
import { useCatalogo, toSelectOptions } from "@/hooks/useCatalogo";
import { v4 as uuid } from "uuid";
import { ContactoEmpresa } from "@/types/empresa";

const empresaSchema = z.object({
  nombreEmpresa: z.string().min(2, "Ingrese el nombre de la empresa"),
  nit: z.string().min(5, "Ingrese un NIT válido"),
  representanteLegal: z.string().optional().or(z.literal("")),
  sectorEconomico: z.string().optional().or(z.literal("")),
  sectorEconomicoOtro: z.string().optional().or(z.literal("")),
  arl: z.string().optional().or(z.literal("")),
  arlOtra: z.string().optional().or(z.literal("")),
  direccion: z.string().optional().or(z.literal("")),
  telefonoEmpresa: z.string().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.sectorEconomico === "otro_sector" && !(data.sectorEconomicoOtro || "").trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sectorEconomicoOtro"],
      message: "Especifique el sector económico",
    });
  }
  if (data.arl === "otra_arl" && !(data.arlOtra || "").trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["arlOtra"],
      message: "Especifique el nombre de la ARL",
    });
  }
});

type EmpresaFormSchema = z.infer<typeof empresaSchema>;

export default function EmpresaFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const isEditing = !!id;

  const { data: empresa, isLoading: isLoadingEmpresa } = useEmpresa(id || "");
  const createEmpresa = useCreateEmpresa();
  const updateEmpresa = useUpdateEmpresa();
  const { data: arlCatalog } = useCatalogo("arl", { onlyActive: true });
  const { data: sectorCatalog } = useCatalogo("sector_economico", { onlyActive: true });

  const [contactos, setContactos] = useState<ContactoEmpresa[]>([
    { id: uuid(), nombre: "", telefono: "", email: "", esPrincipal: true },
  ]);

  const form = useForm<EmpresaFormSchema>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nombreEmpresa: "",
      nit: "",
      representanteLegal: "",
      sectorEconomico: "",
      sectorEconomicoOtro: "",
      arl: "",
      arlOtra: "",
      direccion: "",
      telefonoEmpresa: "",
    },
  });

  useEffect(() => {
    if (empresa) {
      form.reset({
        nombreEmpresa: empresa.nombreEmpresa,
        nit: empresa.nit,
        representanteLegal: empresa.representanteLegal || "",
        sectorEconomico: empresa.sectorEconomico || "",
        sectorEconomicoOtro: empresa.sectorEconomicoOtro || "",
        arl: empresa.arl || "",
        arlOtra: empresa.arlOtra || "",
        direccion: empresa.direccion || "",
        telefonoEmpresa: empresa.telefonoEmpresa || "",
      });
      if (empresa.contactos && empresa.contactos.length > 0) {
        setContactos(empresa.contactos);
      }
    }
  }, [empresa, form]);

  const handleContactoChange = (index: number, field: keyof Omit<ContactoEmpresa, 'id' | 'esPrincipal'>, value: string) => {
    setContactos(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const handleAddContacto = () => {
    setContactos(prev => [...prev, { id: uuid(), nombre: "", telefono: "", email: "", esPrincipal: false }]);
  };

  const handleRemoveContacto = (index: number) => {
    setContactos(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some(c => c.esPrincipal)) {
        updated[0].esPrincipal = true;
      }
      return updated;
    });
  };

  const handleSetPrincipal = (index: number) => {
    setContactos(prev => prev.map((c, i) => ({ ...c, esPrincipal: i === index })));
  };

  const onSubmit = async (data: EmpresaFormSchema) => {
    try {
      const principal = contactos.find(c => c.esPrincipal) || contactos[0];
      const empresaData = {
        nombreEmpresa: data.nombreEmpresa,
        nit: data.nit,
        representanteLegal: data.representanteLegal || "",
        sectorEconomico: data.sectorEconomico || "",
        sectorEconomicoOtro: data.sectorEconomico === "otro_sector" ? (data.sectorEconomicoOtro || "") : "",
        arl: data.arl || "",
        arlOtra: data.arl === "otra_arl" ? (data.arlOtra || "") : "",
        direccion: data.direccion || "",
        telefonoEmpresa: data.telefonoEmpresa || "",
        contactos,
        personaContacto: principal?.nombre || "",
        telefonoContacto: principal?.telefono || "",
        emailContacto: principal?.email || "",
      };

      if (isEditing) {
        await updateEmpresa.mutateAsync({ id, data: empresaData });
        toast({ title: "Empresa actualizada correctamente" });
        logActivity({ action: "editar", module: "empresas", description: `Editó empresa ${data.nombreEmpresa} (NIT: ${data.nit})`, entityType: "empresa", entityId: id, metadata: { nit: data.nit, contactos: contactos.length } });
      } else {
        await createEmpresa.mutateAsync(empresaData);
        toast({ title: "Empresa creada correctamente" });
        logActivity({ action: "crear", module: "empresas", description: `Creó empresa ${data.nombreEmpresa} (NIT: ${data.nit})`, entityType: "empresa", metadata: { nit: data.nit, contactos: contactos.length } });
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
        <IconButton tooltip="Volver" onClick={() => navigate("/empresas")}>
          <ArrowLeft className="h-4 w-4" />
        </IconButton>
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
                        options={toSelectOptions(sectorCatalog, field.value)}
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
              {form.watch("sectorEconomico") === "otro_sector" && (
                <FormField
                  control={form.control}
                  name="sectorEconomicoOtro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sector (especifique) *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nombre del sector económico" />
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
                        options={toSelectOptions(arlCatalog, field.value)}
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
                      <FormLabel>Nombre ARL *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Escriba el nombre de la ARL" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Personas de Contacto</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddContacto}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar contacto
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {contactos.map((contacto, index) => (
                <div key={contacto.id} className="relative border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Contacto {index + 1}</span>
                      {contacto.esPrincipal ? (
                        <Badge variant="default" className="text-xs">Principal</Badge>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-muted-foreground"
                          onClick={() => handleSetPrincipal(index)}
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Marcar como principal
                        </Button>
                      )}
                    </div>
                    {contactos.length > 1 && (
                      <IconButton
                        type="button"
                        tooltip="Eliminar contacto"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveContacto(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Nombre</label>
                      <Input
                        value={contacto.nombre}
                        onChange={e => handleContactoChange(index, "nombre", e.target.value)}
                        placeholder="Nombre completo"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Teléfono</label>
                      <Input
                        value={contacto.telefono}
                        onChange={e => handleContactoChange(index, "telefono", e.target.value)}
                        placeholder="3001234567"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        value={contacto.email}
                        onChange={e => handleContactoChange(index, "email", e.target.value)}
                        placeholder="contacto@empresa.com"
                      />
                    </div>
                  </div>
                </div>
              ))}
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
