import { Settings, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useTiposCertificado } from "@/hooks/useTiposCertificado";
import { TIPO_FORMACION_LABELS } from "@/types/curso";
import { useState } from "react";

export default function TiposCertificadoPage() {
  const { data: tipos, isLoading } = useTiposCertificado();
  const [busqueda, setBusqueda] = useState("");

  const filtered = (tipos ?? []).filter(t =>
    !busqueda || t.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tipos de Certificado</h1>
            <p className="text-sm text-muted-foreground">Configuración de tipos y reglas de certificación</p>
          </div>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Tipo
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar tipo..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Settings className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">Sin tipos configurados</p>
          <p className="text-sm">Crea tipos de certificado para definir reglas de generación.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo Formación</TableHead>
              <TableHead>Regla Código</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.nombre}</TableCell>
                <TableCell>{TIPO_FORMACION_LABELS[t.tipoFormacion]}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{t.reglaCodigo}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
