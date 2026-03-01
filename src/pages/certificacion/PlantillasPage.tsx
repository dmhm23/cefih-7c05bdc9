import { FileText, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlantillas } from "@/hooks/usePlantillas";
import { useState } from "react";

export default function PlantillasPage() {
  const { data: plantillas, isLoading } = usePlantillas();
  const [busqueda, setBusqueda] = useState("");

  const filtered = (plantillas ?? []).filter(p =>
    !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Plantillas de Certificado</h1>
            <p className="text-sm text-muted-foreground">Gestión de plantillas SVG para generación de certificados</p>
          </div>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar plantilla..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
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
            {filtered.map(p => (
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
    </div>
  );
}
