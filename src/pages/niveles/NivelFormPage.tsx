import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNivelFormacion, useCreateNivelFormacion, useUpdateNivelFormacion } from "@/hooks/useNivelesFormacion";
import { useToast } from "@/hooks/use-toast";
import { CATALOGO_DOCUMENTOS, TIPOS_CAMPO_LABELS, CampoAdicional } from "@/types/nivelFormacion";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CampoAdicionalModal } from "@/components/niveles/CampoAdicionalModal";

const nivelSchema = z.object({
  nombreNivel: z.string().min(1, "El nombre es obligatorio"),
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
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDocName, setNewDocName] = useState("");

  // Campos adicionales as local state
  const [camposAdicionales, setCamposAdicionales] = useState<CampoAdicional[]>([]);
  const [showCampoModal, setShowCampoModal] = useState(false);
  const [editingCampo, setEditingCampo] = useState<CampoAdicional | null>(null);

  const { data: nivel, isLoading } = useNivelFormacion(id || "");
  const createNivel = useCreateNivelFormacion();
  const updateNivel = useUpdateNivelFormacion();

  // Track custom documents (non-catalog)
  const [customDocs, setCustomDocs] = useState<{ key: string; label: string }[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(nivelSchema),
    defaultValues: {
      nombreNivel: "",
      duracionDias: undefined,
      duracionHoras: undefined,
      documentosRequeridos: [],
      observaciones: "",
    },
  });

  useEffect(() => {
    if (isEdit && nivel) {
      const catalogKeys = CATALOGO_DOCUMENTOS.map(d => d.key as string);
      const savedCustom = nivel.documentosRequeridos
        .filter(key => !catalogKeys.includes(key))
        .map(key => ({ key, label: key }));
      setCustomDocs(savedCustom);
      setCamposAdicionales(nivel.camposAdicionales || []);

      form.reset({
        nombreNivel: nivel.nombreNivel,
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
        duracionDias: data.duracionDias,
        duracionHoras: data.duracionHoras,
        documentosRequeridos: data.documentosRequeridos,
        camposAdicionales,
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

  const toggleDocumento = (key: string) => {
    const current = form.getValues("documentosRequeridos");
    if (current.includes(key)) {
      form.setValue("documentosRequeridos", current.filter(d => d !== key), { shouldValidate: true });
    } else {
      form.setValue("documentosRequeridos", [...current, key], { shouldValidate: true });
    }
  };

  const handleAddCustomDoc = () => {
    const trimmed = newDocName.trim();
    if (!trimmed) return;
    const allKeys = [...CATALOGO_DOCUMENTOS.map(d => d.key), ...customDocs.map(d => d.key)];
    if (allKeys.includes(trimmed)) {
      toast({ title: "Ese documento ya existe", variant: "destructive" });
      return;
    }
    setCustomDocs(prev => [...prev, { key: trimmed, label: trimmed }]);
    const current = form.getValues("documentosRequeridos");
    form.setValue("documentosRequeridos", [...current, trimmed], { shouldValidate: true });
    setNewDocName("");
    setShowAddDoc(false);
  };

  const removeCustomDoc = (key: string) => {
    setCustomDocs(prev => prev.filter(d => d.key !== key));
    const current = form.getValues("documentosRequeridos");
    form.setValue("documentosRequeridos", current.filter(d => d !== key), { shouldValidate: true });
  };

  const handleSaveCampo = (campo: CampoAdicional) => {
    setCamposAdicionales((prev) => {
      const idx = prev.findIndex((c) => c.id === campo.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = campo;
        return updated;
      }
      return [...prev, campo];
    });
    setEditingCampo(null);
  };

  const handleEditCampo = (campo: CampoAdicional) => {
    setEditingCampo(campo);
    setShowCampoModal(true);
  };

  const handleRemoveCampo = (id: string) => {
    setCamposAdicionales((prev) => prev.filter((c) => c.id !== id));
  };

  const isPending = createNivel.isPending || updateNivel.isPending;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
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
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              {/* Campos adicionales — lista */}
              {camposAdicionales.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground">Campos adicionales</p>
                  {camposAdicionales.map((campo) => (
                    <div key={campo.id} className="flex items-center justify-between py-2 px-3 rounded-md border gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm font-medium truncate">{campo.nombre}</span>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {TIPOS_CAMPO_LABELS[campo.tipo]}
                        </Badge>
                        {campo.obligatorio && (
                          <Badge variant="default" className="text-[10px] shrink-0">
                            Obligatorio
                          </Badge>
                        )}
                        {campo.alcance === "todos_los_niveles" && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            Global
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditCampo(campo)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveCampo(campo.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setEditingCampo(null); setShowCampoModal(true); }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Añadir campo
              </Button>
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

                {customDocs.map((doc) => {
                  const isActive = form.watch("documentosRequeridos").includes(doc.key);
                  return (
                    <div key={doc.key} className="flex items-center justify-between py-2 px-3 rounded-md border border-dashed">
                      <Label className="cursor-pointer flex-1">{doc.label}</Label>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => toggleDocumento(doc.key)}
                        />
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeCustomDoc(doc.key)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowAddDoc(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Añadir documento
              </Button>
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
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
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

      {/* Modal añadir documento */}
      <Dialog open={showAddDoc} onOpenChange={setShowAddDoc}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Añadir Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Nombre del documento</Label>
            <Input
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              placeholder="Ej: Certificado de Bomberos"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomDoc())}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDoc(false); setNewDocName(""); }}>
              Cancelar
            </Button>
            <Button onClick={handleAddCustomDoc} disabled={!newDocName.trim()}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal campo adicional */}
      <CampoAdicionalModal
        open={showCampoModal}
        onOpenChange={(open) => { setShowCampoModal(open); if (!open) setEditingCampo(null); }}
        onSave={handleSaveCampo}
        existingNames={camposAdicionales.map((c) => c.nombre)}
        editingCampo={editingCampo}
      />
    </div>
  );
}
