import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useNivelFormacion, useCreateNivelFormacion, useUpdateNivelFormacion } from "@/hooks/useNivelesFormacion";
import { useToast } from "@/hooks/use-toast";
import { CATALOGO_DOCUMENTOS, DocumentoReqKey } from "@/types/nivelFormacion";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const nivelSchema = z.object({
  nombreNivel: z.string().min(1, "El nombre es obligatorio"),
  tipoCertificacion: z.string().optional(),
  consecutivo: z.string().min(1, "El consecutivo es obligatorio"),
  duracionDias: z.coerce.number().min(0).optional(),
  duracionHoras: z.coerce.number().min(0).optional(),
  documentosRequeridos: z.array(z.string()),
  observaciones: z.string().optional(),
}).refine(
  (data) => (data.duracionDias && data.duracionDias > 0) || (data.duracionHoras && data.duracionHoras > 0),
  { message: "Debe especificar al menos días u horas", path: ["duracionDias"] }
);

type FormValues = z.infer<typeof nivelSchema>;

export default function NivelFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: nivel, isLoading } = useNivelFormacion(id || "");
  const createNivel = useCreateNivelFormacion();
  const updateNivel = useUpdateNivelFormacion();

  const form = useForm<FormValues>({
    resolver: zodResolver(nivelSchema),
    defaultValues: {
      nombreNivel: "",
      tipoCertificacion: "",
      consecutivo: "",
      duracionDias: undefined,
      duracionHoras: undefined,
      documentosRequeridos: [],
      observaciones: "",
    },
  });

  useEffect(() => {
    if (isEdit && nivel) {
      form.reset({
        nombreNivel: nivel.nombreNivel,
        tipoCertificacion: nivel.tipoCertificacion || "",
        consecutivo: nivel.consecutivo,
        duracionDias: nivel.duracionDias,
        duracionHoras: nivel.duracionHoras,
        documentosRequeridos: nivel.documentosRequeridos,
        observaciones: nivel.observaciones || "",
      });
    }
  }, [nivel, isEdit, form]);

  if (isEdit && isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        nombreNivel: data.nombreNivel,
        tipoCertificacion: data.tipoCertificacion,
        consecutivo: data.consecutivo,
        duracionDias: data.duracionDias,
        duracionHoras: data.duracionHoras,
        documentosRequeridos: data.documentosRequeridos as DocumentoReqKey[],
        observaciones: data.observaciones,
      };

      if (isEdit && id) {
        await updateNivel.mutateAsync({ id, data: payload });
        toast({ title: "Nivel actualizado correctamente" });
      } else {
        await createNivel.mutateAsync(payload);
        toast({ title: "Nivel creado correctamente" });
      }
      navigate("/niveles");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el nivel",
        variant: "destructive",
      });
    }
  };

  const toggleDocumento = (key: DocumentoReqKey) => {
    const current = form.getValues("documentosRequeridos");
    if (current.includes(key)) {
      form.setValue("documentosRequeridos", current.filter(d => d !== key), { shouldValidate: true });
    } else {
      form.setValue("documentosRequeridos", [...current, key], { shouldValidate: true });
    }
  };

  const isPending = createNivel.isPending || updateNivel.isPending;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/niveles")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? "Editar Nivel" : "Nuevo Nivel"}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? "Modificar nivel de formación" : "Crear un nuevo nivel de formación"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Sección A — Información general */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombreNivel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Nivel *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: Trabajador Autorizado" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="consecutivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consecutivo *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: 01" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipoCertificacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Certificación</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Opcional" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duracionDias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración (días)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min={0} max={365} placeholder="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duracionHoras"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración (horas)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min={0} max={2000} placeholder="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sección B — Requisitos documentales */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Requisitos Documentales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Seleccione los documentos que se requerirán para este nivel de formación.
              </p>
              <div className="space-y-3">
                {CATALOGO_DOCUMENTOS.map((doc) => {
                  const isActive = form.watch("documentosRequeridos").includes(doc.key);
                  return (
                    <div key={doc.key} className="flex items-center justify-between py-2 px-3 rounded-md border">
                      <Label htmlFor={`doc-${doc.key}`} className="cursor-pointer flex-1">
                        {doc.label}
                      </Label>
                      <Switch
                        id={`doc-${doc.key}`}
                        checked={isActive}
                        onCheckedChange={() => toggleDocumento(doc.key)}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sección C — Observaciones */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea {...field} placeholder="Condiciones especiales o aclaraciones del nivel..." rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/niveles")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEdit ? "Guardando..." : "Creando..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEdit ? "Guardar Cambios" : "Crear Nivel"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
