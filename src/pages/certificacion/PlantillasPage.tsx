import { FileText, Pencil, Plus, Search, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlantillas } from "@/hooks/usePlantillas";
import { useTiposCertificado } from "@/hooks/useTiposCertificado";
import { TIPO_FORMACION_LABELS } from "@/types/curso";
import { useState } from "react";

export default function PlantillasPage() {
  const { data: plantillas, isLoading: loadingPlantillas } = usePlantillas();
  const { data: tipos, isLoading: loadingTipos } = useTiposCertificado();
  const [busqueda, setBusqueda] = useState("");

  const filteredPlantillas = (plantillas ?? []).filter(p =>
    !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const filteredTipos = (tipos ?? []).filter(t =>
    !busqueda || t.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Plantillas de Certificado</h1>
            <p className="text-sm text-muted-foreground">Gestión de plantillas SVG y tipos de certificado</p>
          </div>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="plantillas">
        <TabsList>
          <TabsTrigger value="plantillas">
            <FileText className="h-4 w-4 mr-1" />
            Plantillas
          </TabsTrigger>
          <TabsTrigger value="tipos">
            <Settings2 className="h-4 w-4 mr-1" />
            Tipos de Certificado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plantillas" className="mt-4">
          {loadingPlantillas ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredPlantillas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">Sin plantillas</p>
              <p className="text-sm">Sube una plantilla SVG para comenzar a generar certificados.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Versión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlantillas.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell>
                      <Badge variant={p.activa ? "default" : "secondary"}>{p.activa ? "Activa" : "Inactiva"}</Badge>
                    </TableCell>
                    <TableCell>{p.tokensDetectados.length}</TableCell>
                    <TableCell>v{p.version}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="tipos" className="mt-4">
          {loadingTipos ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredTipos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Settings2 className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">Sin tipos de certificado</p>
              <p className="text-sm">Crea un tipo para asociar reglas y plantillas.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo de Formación</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Docs</TableHead>
                  <TableHead>Formatos</TableHead>
                  <TableHead>Regla Código</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTipos.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.nombre}</TableCell>
                    <TableCell>{TIPO_FORMACION_LABELS[t.tipoFormacion] || t.tipoFormacion}</TableCell>
                    <TableCell>
                      <Badge variant={t.reglas.requierePago ? "default" : "secondary"}>
                        {t.reglas.requierePago ? "Sí" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.reglas.requiereDocumentos ? "default" : "secondary"}>
                        {t.reglas.requiereDocumentos ? "Sí" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.reglas.requiereFormatos ? "default" : "secondary"}>
                        {t.reglas.requiereFormatos ? "Sí" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{t.reglaCodigo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
