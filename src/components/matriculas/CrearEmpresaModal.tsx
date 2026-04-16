import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { SECTORES_ECONOMICOS, ARL_OPTIONS } from "@/data/formOptions";
import { Empresa, ContactoEmpresa } from "@/types/empresa";
import { useState } from "react";
import { v4 as uuid } from "uuid";

const empresaSchema = z.object({
  nombreEmpresa: z.string().min(2, "Ingrese el nombre de la empresa"),
  nit: z.string().min(5, "Ingrese un NIT válido"),
  representanteLegal: z.string().optional().or(z.literal("")),
  sectorEconomico: z.string().optional().or(z.literal("")),
  arl: z.string().optional().or(z.literal("")),
  direccion: z.string().optional().or(z.literal("")),
  telefonoEmpresa: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof empresaSchema>;

interface CrearEmpresaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmpresaCreated: (empresa: Empresa) => void;
}

export function CrearEmpresaModal({ open, onOpenChange, onEmpresaCreated }: CrearEmpresaModalProps) {
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const createEmpresa = useCreateEmpresa();

  const [contactos, setContactos] = useState<ContactoEmpresa[]>([
    { id: uuid(), nombre: "", telefono: "", email: "", esPrincipal: true },
  ]);

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
    },
  });

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

  const onSubmit = async (data: FormData) => {
    try {
      const principal = contactos.find(c => c.esPrincipal) || contactos[0];
      const result = await createEmpresa.mutateAsync({
        nombreEmpresa: data.nombreEmpresa,
        nit: data.nit,
        representanteLegal: data.representanteLegal || "",
        sectorEconomico: data.sectorEconomico || "",
        arl: data.arl || "",
        direccion: data.direccion || "",
        telefonoEmpresa: data.telefonoEmpresa || "",
        contactos,
        personaContacto: principal?.nombre || "",
        telefonoContacto: principal?.telefono || "",
        emailContacto: principal?.email || "",
        
      });
      toast({ title: "Empresa creada correctamente" });
      logActivity({ action: "crear", module: "empresas", description: `Creó empresa "${data.nombreEmpresa}" (NIT: ${data.nit}) desde matrícula`, entityType: "empresa", entityId: result.id, metadata: { nombre: data.nombreEmpresa, nit: data.nit } });
      form.reset();
      setContactos([{ id: uuid(), nombre: "", telefono: "", email: "", esPrincipal: true }]);
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

            {/* Contactos dinámicos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Personas de Contacto</p>
                <Button type="button" variant="outline" size="sm" onClick={handleAddContacto}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Agregar
                </Button>
              </div>
              {contactos.map((contacto, index) => (
                <div key={contacto.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Contacto {index + 1}</span>
                      {contacto.esPrincipal ? (
                        <Badge variant="default" className="text-[10px] h-5">Principal</Badge>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[10px] text-muted-foreground px-1.5"
                          onClick={() => handleSetPrincipal(index)}
                        >
                          <Star className="h-3 w-3 mr-0.5" />
                          Principal
                        </Button>
                      )}
                    </div>
                    {contactos.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveContacto(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      value={contacto.nombre}
                      onChange={e => handleContactoChange(index, "nombre", e.target.value)}
                      placeholder="Nombre"
                    />
                    <Input
                      value={contacto.telefono}
                      onChange={e => handleContactoChange(index, "telefono", e.target.value)}
                      placeholder="Teléfono"
                    />
                    <Input
                      type="email"
                      value={contacto.email}
                      onChange={e => handleContactoChange(index, "email", e.target.value)}
                      placeholder="Email"
                    />
                  </div>
                </div>
              ))}
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
