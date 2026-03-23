import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/shared/DateField";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useCreatePersona } from "@/hooks/usePersonas";
import { useToast } from "@/hooks/use-toast";
import {
  TIPOS_DOCUMENTO,
  GENEROS,
  PAISES,
  NIVELES_EDUCATIVOS,
  GRUPOS_SANGUINEOS,
} from "@/data/formOptions";

const personaSchema = z.object({
  tipoDocumento: z.enum(['CC', 'CE', 'PA', 'PE', 'PP']),
  numeroDocumento: z.string().min(6, "Mínimo 6 caracteres"),
  nombres: z.string().min(2, "Ingrese el nombre"),
  apellidos: z.string().min(2, "Ingrese los apellidos"),
  genero: z.enum(['M', 'F']),
  paisNacimiento: z.string().min(1, "Seleccione el país"),
  fechaNacimiento: z.string().min(1, "Seleccione la fecha"),
  rh: z.string().min(1, "Seleccione el RH"),
  nivelEducativo: z.string().min(1, "Seleccione el nivel"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().min(7, "Teléfono inválido"),
  contactoEmergenciaNombre: z.string().min(2, "Ingrese el nombre"),
  contactoEmergenciaTelefono: z.string().min(7, "Teléfono inválido"),
  contactoEmergenciaParentesco: z.string().min(2, "Ingrese el parentesco"),
});

type FormData = z.infer<typeof personaSchema>;

interface CrearPersonaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPersonaCreated: (id: string) => void;
}

export function CrearPersonaModal({ open, onOpenChange, onPersonaCreated }: CrearPersonaModalProps) {
  const { toast } = useToast();
  const createPersona = useCreatePersona();

  const form = useForm<FormData>({
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

  const onSubmit = async (data: FormData) => {
    try {
      const result = await createPersona.mutateAsync({
        tipoDocumento: data.tipoDocumento,
        numeroDocumento: data.numeroDocumento,
        nombres: data.nombres,
        apellidos: data.apellidos,
        genero: data.genero,
        paisNacimiento: data.paisNacimiento,
        fechaNacimiento: data.fechaNacimiento,
        rh: data.rh,
        nivelEducativo: data.nivelEducativo as any,
        areaTrabajo: 'operativa',
        sectorEconomico: '',
        email: data.email || '',
        telefono: data.telefono,
        contactoEmergencia: {
          nombre: data.contactoEmergenciaNombre,
          telefono: data.contactoEmergenciaTelefono,
          parentesco: data.contactoEmergenciaParentesco,
        },
      });
      toast({ title: "Persona creada correctamente" });
      form.reset();
      onPersonaCreated(result.id);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la persona",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Persona</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Identificación */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipoDocumento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Documento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPOS_DOCUMENTO.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>

            {/* Datos personales */}
            <div className="grid grid-cols-2 gap-4">
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
                name="genero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Género *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENEROS.map((g) => (
                          <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <FormField
                control={form.control}
                name="fechaNacimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Nacimiento *</FormLabel>
                    <FormControl>
                      <DateField value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RH *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GRUPOS_SANGUINEOS.map((rh) => (
                          <SelectItem key={rh.value} value={rh.value}>{rh.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>

            {/* Contacto */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Contacto de emergencia */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="contactoEmergenciaNombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergencia - Nombre *</FormLabel>
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
                    <FormLabel>Emergencia - Teléfono *</FormLabel>
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
                      <Input {...field} placeholder="Esposa, Hermano..." />
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
              <Button type="submit" disabled={createPersona.isPending}>
                {createPersona.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Persona"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
