import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, Settings2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GestionCargosModal } from "@/components/personal/GestionCargosModal";
import { AdjuntosPersonal } from "@/components/personal/AdjuntosPersonal";
import { FirmaPersonal } from "@/components/personal/FirmaPersonal";
import {
  usePersonal,
  useCreatePersonal,
  useUpdatePersonal,
  useCargos,
  useUpdateFirma,
  useDeleteFirma,
  useAddAdjunto,
  useDeleteAdjunto,
} from "@/hooks/usePersonal";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { AdjuntoPersonal } from "@/types/personal";
import { v4 as uuidv4 } from "uuid";

const PRESET_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f97316", // orange
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#ef4444", // red
  "#eab308", // yellow
  "#06b6d4", // cyan
  "#f43f5e", // rose
];

const personalSchema = z.object({
  nombres: z.string().min(2, "Ingrese el nombre"),
  apellidos: z.string().min(2, "Ingrese los apellidos"),
  cargoId: z.string().min(1, "Seleccione un rol"),
});

type PersonalFormSchema = z.infer<typeof personalSchema>;

export default function PersonalFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;
  const [isSaving, setIsSaving] = useState(false);

  const { data: personal, isLoading: isLoadingPersonal } = usePersonal(id || "");
  const { data: cargos = [] } = useCargos();
  const createPersonal = useCreatePersonal();
  const updatePersonal = useUpdatePersonal();
  const updateFirma = useUpdateFirma();
  const deleteFirma = useDeleteFirma();
  const addAdjunto = useAddAdjunto();
  const deleteAdjunto = useDeleteAdjunto();
  const [cargosModalOpen, setCargosModalOpen] = useState(false);
  const [colorCalendario, setColorCalendario] = useState<string>(PRESET_COLORS[0]);

  // Local state for creation mode
  const [tempFirma, setTempFirma] = useState<string | undefined>(undefined);
  const [tempAdjuntos, setTempAdjuntos] = useState<AdjuntoPersonal[]>([]);
  const [tempFiles, setTempFiles] = useState<File[]>([]);

  const form = useForm<PersonalFormSchema>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      nombres: "",
      apellidos: "",
      cargoId: "",
    },
  });

  useEffect(() => {
    if (personal) {
      form.reset({
        nombres: personal.nombres,
        apellidos: personal.apellidos,
        cargoId: personal.cargoId,
      });
      if (personal.colorCalendario) {
        setColorCalendario(personal.colorCalendario);
      }
    }
  }, [personal, form]);

  // Determine if selected cargo is 'entrenador' type
  const selectedCargoId = form.watch("cargoId");
  const selectedCargo = cargos.find((c) => c.id === selectedCargoId);
  const isEntrenador = selectedCargo?.tipo === "entrenador";

  const handleCargoCreated = (cargoId: string) => {
    form.setValue("cargoId", cargoId);
  };

  // --- Firma handlers ---
  const handleGuardarFirma = (firmaBase64: string) => {
    if (isEditing && id) {
      updateFirma.mutate(
        { id, firmaBase64 },
        { onSuccess: () => toast({ title: "Firma guardada" }) }
      );
    } else {
      setTempFirma(firmaBase64);
    }
  };

  const handleEliminarFirma = () => {
    if (isEditing && id) {
      deleteFirma.mutate(id, {
        onSuccess: () => toast({ title: "Firma eliminada" }),
      });
    } else {
      setTempFirma(undefined);
    }
  };

  // --- Adjuntos handlers ---
  const handleUploadAdjuntos = (files: File[]) => {
    if (isEditing && id) {
      Promise.all(files.map(file =>
        addAdjunto.mutateAsync({ personalId: id, file })
      )).then(() => toast({ title: files.length === 1 ? "Archivo adjuntado" : `${files.length} archivos adjuntados` }));
    } else {
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          const adj: AdjuntoPersonal = {
            id: uuidv4(),
            nombre: file.name,
            tipo: file.type,
            tamano: file.size,
            fechaCarga: new Date().toISOString(),
            dataUrl: reader.result as string,
          };
          setTempAdjuntos((prev) => [...prev, adj]);
          setTempFiles((prev) => [...prev, file]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDeleteAdjunto = (adjuntoId: string) => {
    if (isEditing && id) {
      deleteAdjunto.mutate(
        { personalId: id, adjuntoId },
        { onSuccess: () => toast({ title: "Archivo eliminado" }) }
      );
    } else {
      const idx = tempAdjuntos.findIndex((a) => a.id === adjuntoId);
      setTempAdjuntos((prev) => prev.filter((a) => a.id !== adjuntoId));
      if (idx >= 0) setTempFiles((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const onSubmit = async (data: PersonalFormSchema) => {
    setIsSaving(true);
    try {
      const cargo = cargos.find((c) => c.id === data.cargoId);
      const personalData = {
        nombres: data.nombres,
        apellidos: data.apellidos,
        cargoId: data.cargoId,
        cargoNombre: cargo?.nombre || "",
        ...(cargo?.tipo === "entrenador" ? { colorCalendario } : {}),
      };

      if (isEditing) {
        await updatePersonal.mutateAsync({ id, data: personalData });
        toast({ title: "Perfil actualizado correctamente" });
      } else {
        const newPersonal = await createPersonal.mutateAsync(personalData);

        // Upload firma and adjuntos in parallel
        const uploads: Promise<any>[] = [];
        if (tempFirma) {
          uploads.push(updateFirma.mutateAsync({ id: newPersonal.id, firmaBase64: tempFirma }));
        }
        for (const file of tempFiles) {
          uploads.push(addAdjunto.mutateAsync({ personalId: newPersonal.id, file }));
        }
        if (uploads.length > 0) {
          await Promise.all(uploads);
        }

        toast({ title: "Perfil creado correctamente" });
      }
      navigate("/gestion-personal");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isSaving;

  if (isEditing && isLoadingPersonal) {
    return <div className="flex justify-center py-12">Cargando...</div>;
  }

  const adjuntosToShow = isEditing ? (personal?.adjuntos || []) : tempAdjuntos;
  const firmaToShow = isEditing ? personal?.firmaBase64 : tempFirma;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <IconButton tooltip="Volver" onClick={() => navigate("/gestion-personal")}>
          <ArrowLeft className="h-4 w-4" />
        </IconButton>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Editar Perfil" : "Nuevo Perfil"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing ? "Actualiza los datos del perfil" : "Registra un nuevo perfil de personal"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, () => toast({ title: "Campos incompletos", description: "Por favor, completa todos los campos obligatorios correctamente.", variant: "destructive" }))} className="space-y-5">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Datos del Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombres"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombres *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: Carlos Andrés" />
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
                        <Input {...field} placeholder="Ej: Rodríguez Pérez" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="cargoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol *</FormLabel>
                    <div className="flex items-center gap-2">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Seleccionar rol..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cargos.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <IconButton
                        type="button"
                        tooltip="Gestionar roles"
                        variant="outline"
                        onClick={() => setCargosModalOpen(true)}
                      >
                        <Settings2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Color selector for trainers */}
              {isEntrenador && (
                <div className="space-y-2">
                  <FormLabel>Color del Calendario</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Este color identificará al entrenador en el calendario de cursos
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="h-8 w-8 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          borderColor: colorCalendario === color ? "hsl(var(--foreground))" : "transparent",
                        }}
                        onClick={() => setColorCalendario(color)}
                        title={color}
                      >
                        {colorCalendario === color && (
                          <Check className="h-4 w-4 text-white drop-shadow-md" />
                        )}
                      </button>
                    ))}
                    <div className="flex items-center gap-2 ml-2">
                      <label
                        className="h-8 w-8 rounded-full border-2 border-dashed cursor-pointer flex items-center justify-center overflow-hidden"
                        style={{
                          borderColor: !PRESET_COLORS.includes(colorCalendario) ? "hsl(var(--foreground))" : "hsl(var(--border))",
                          backgroundColor: !PRESET_COLORS.includes(colorCalendario) ? colorCalendario : undefined,
                        }}
                        title="Color personalizado"
                      >
                        <input
                          type="color"
                          value={colorCalendario}
                          onChange={(e) => setColorCalendario(e.target.value)}
                          className="sr-only"
                        />
                        {!PRESET_COLORS.includes(colorCalendario) && (
                          <Check className="h-4 w-4 text-white drop-shadow-md" />
                        )}
                      </label>
                      <span className="text-xs text-muted-foreground">Personalizado</span>
                    </div>
                  </div>
                  {/* Preview */}
                  <div
                    className="mt-2 rounded-md px-3 py-2 text-xs font-medium inline-flex items-center gap-2"
                    style={{
                      backgroundColor: colorCalendario + "20",
                      color: colorCalendario,
                      borderLeft: `3px solid ${colorCalendario}`,
                    }}
                  >
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorCalendario }} />
                    Vista previa en calendario
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documentos Adjuntos (opcional) */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Documentos Adjuntos</CardTitle>
              <p className="text-xs text-muted-foreground">
                Opcional — Suba hojas de vida, contratos u otros documentos relevantes
              </p>
            </CardHeader>
            <CardContent>
              <AdjuntosPersonal
                adjuntos={adjuntosToShow}
                onUpload={handleUploadAdjuntos}
                onDelete={handleDeleteAdjunto}
                isUploading={addAdjunto.isPending}
                isDeleting={deleteAdjunto.isPending}
              />
            </CardContent>
          </Card>

          {/* Firma Digital (opcional) */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Firma Digital</CardTitle>
              <p className="text-xs text-muted-foreground">
                Opcional — La firma se usará en formatos legales generados por el sistema
              </p>
            </CardHeader>
            <CardContent>
              <FirmaPersonal
                firmaExistente={firmaToShow}
                onGuardarFirma={handleGuardarFirma}
                onEliminarFirma={handleEliminarFirma}
                isPending={updateFirma.isPending || deleteFirma.isPending}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/gestion-personal")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? "Actualizando..." : "Creando..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Guardar Cambios" : "Crear Perfil"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      <GestionCargosModal
        open={cargosModalOpen}
        onOpenChange={setCargosModalOpen}
        onCargoCreated={handleCargoCreated}
      />
    </div>
  );
}
