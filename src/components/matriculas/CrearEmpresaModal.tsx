import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { useCreateEmpresa } from "@/hooks/useEmpresas";
import { useToast } from "@/hooks/use-toast";
import { SECTORES_ECONOMICOS, ARL_OPTIONS } from "@/data/formOptions";
import { Empresa } from "@/types/empresa";

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
});

type FormData = z.infer<typeof empresaSchema>;

interface CrearEmpresaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmpresaCreated: (empresa: Empresa) => void;
}

export function CrearEmpresaModal({ open, onOpenChange, onEmpresaCreated }: CrearEmpresaModalProps) {
  const { toast } = useToast();
  const createEmpresa = useCreateEmpresa();

  const form = useForm<FormData>({
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
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await createEmpresa.mutateAsync({
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
        activo: true,
      });
      toast({ title: "Empresa creada correctamente" });
      form.reset();
      onEmpresaCreated(result);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la empresa",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Empresa</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Información General */}
            <div className="grid grid-cols-2 gap-4">
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
                      <Input {...field} placeholder="900123456-7" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createEmpresa.isPending}>
                {createEmpresa.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Empresa"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
