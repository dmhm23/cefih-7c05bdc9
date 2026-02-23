import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, Settings2 } from "lucide-react";
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

const personalSchema = z.object({
  nombres: z.string().min(2, "Ingrese el nombre"),
  apellidos: z.string().min(2, "Ingrese los apellidos"),
  cargoId: z.string().min(1, "Seleccione un cargo"),
});

type PersonalFormSchema = z.infer<typeof personalSchema>;

export default function PersonalFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;

  const { data: personal, isLoading: isLoadingPersonal } = usePersonal(id || "");
  const { data: cargos = [] } = useCargos();
  const createPersonal = useCreatePersonal();
  const updatePersonal = useUpdatePersonal();
  const updateFirma = useUpdateFirma();
  const deleteFirma = useDeleteFirma();
  const addAdjunto = useAddAdjunto();
  const deleteAdjunto = useDeleteAdjunto();
  const [cargosModalOpen, setCargosModalOpen] = useState(false);

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
    }
  }, [personal, form]);

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
  const handleUploadAdjunto = (file: File) => {
    if (isEditing && id) {
      addAdjunto.mutate(
        { personalId: id, file },
        { onSuccess: () => toast({ title: "Archivo adjuntado" }) }
      );
    } else {
      // Store locally for creation mode
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
    try {
      const cargo = cargos.find((c) => c.id === data.cargoId);
      const personalData = {
        nombres: data.nombres,
        apellidos: data.apellidos,
        cargoId: data.cargoId,
        cargoNombre: cargo?.nombre || "",
      };

      if (isEditing) {
        await updatePersonal.mutateAsync({ id, data: personalData });
        toast({ title: "Perfil actualizado correctamente" });
      } else {
        const newPersonal = await createPersonal.mutateAsync(personalData);

        // Upload pending firma
        if (tempFirma) {
          await updateFirma.mutateAsync({ id: newPersonal.id, firmaBase64: tempFirma });
        }

        // Upload pending adjuntos
        for (const file of tempFiles) {
          await addAdjunto.mutateAsync({ personalId: newPersonal.id, file });
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
    }
  };

  const isLoading = createPersonal.isPending || updatePersonal.isPending;

  if (isEditing && isLoadingPersonal) {
    return <div className="flex justify-center py-12">Cargando...</div>;
  }

  const adjuntosToShow = isEditing ? (personal?.adjuntos || []) : tempAdjuntos;
  const firmaToShow = isEditing ? personal?.firmaBase64 : tempFirma;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/gestion-personal")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                    <FormLabel>Cargo *</FormLabel>
                    <div className="flex items-center gap-2">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Seleccionar cargo..." />
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
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setCargosModalOpen(true)}
                        title="Gestionar cargos"
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                onUpload={handleUploadAdjunto}
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
