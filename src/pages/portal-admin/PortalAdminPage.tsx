import { useState } from 'react';
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Smartphone, Settings, BarChart3 } from 'lucide-react';
import { DocumentosCatalogoTable } from '@/components/portal-admin/DocumentosCatalogoTable';
import { NivelesHabilitacionGrid } from '@/components/portal-admin/NivelesHabilitacionGrid';
import { MonitoreoTable } from '@/components/portal-admin/MonitoreoTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  usePortalAdminConfig,
  useSaveDocumentoConfig,
  useDeleteDocumentoConfig,
  useTogglePortalGlobal,
  useUpdateOrdenDocumentos,
  useUpdateHabilitacionNivel,
} from '@/hooks/usePortalAdmin';

export default function PortalAdminPage() {
  const [confirmDesactivar, setConfirmDesactivar] = useState(false);
  const { data: config, isLoading } = usePortalAdminConfig();
  const saveDoc = useSaveDocumentoConfig();
  const deleteDoc = useDeleteDocumentoConfig();
  const toggleGlobal = useTogglePortalGlobal();
  const updateOrden = useUpdateOrdenDocumentos();
  const updateNivel = useUpdateHabilitacionNivel();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Portal Estudiante</h1>
            <p className="text-sm text-muted-foreground">Administración y configuración</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="portal-global" className="text-sm">Portal activo por defecto</Label>
          <Switch
            id="portal-global"
            checked={config?.portalActivoPorDefecto ?? true}
            onCheckedChange={(checked) => {
              if (!checked) {
                setConfirmDesactivar(true);
              } else {
                toggleGlobal.mutate(true);
              }
            }}
          />
        </div>
      </div>

      <ConfirmDialog
        open={confirmDesactivar}
        onOpenChange={setConfirmDesactivar}
        title="Desactivar portal por defecto"
        description="Al desactivar esta opción, las nuevas matrículas no tendrán acceso al portal a menos que se habilite manualmente. ¿Deseas continuar?"
        confirmText="Desactivar"
        variant="destructive"
        onConfirm={() => {
          toggleGlobal.mutate(false);
          setConfirmDesactivar(false);
        }}
      />

      {/* Tabs */}
      <Tabs defaultValue="configuracion">
        <TabsList>
          <TabsTrigger value="configuracion" className="gap-1.5">
            <Settings className="h-4 w-4" /> Configuración
          </TabsTrigger>
          <TabsTrigger value="monitoreo" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Monitoreo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuracion" className="space-y-8 mt-4">
          <section>
            <h2 className="text-lg font-semibold mb-3">Catálogo de documentos</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Define los documentos disponibles en el portal, su tipo, dependencias y orden de aparición.
            </p>
            <DocumentosCatalogoTable
              documentos={config?.documentos || []}
              onSave={(doc) => saveDoc.mutate(doc)}
              onDelete={(key) => deleteDoc.mutate(key)}
              onReorder={(keys) => updateOrden.mutate(keys)}
            />
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Habilitación por nivel de formación</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Controla qué documentos se habilitan según el nivel de formación del curso.
            </p>
            <NivelesHabilitacionGrid
              documentos={config?.documentos || []}
              onToggle={(key, nivel, activo) => updateNivel.mutate({ key, nivel, activo })}
            />
          </section>
        </TabsContent>

        <TabsContent value="monitoreo" className="mt-4">
          <MonitoreoTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
