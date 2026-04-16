import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Loader2, AlertCircle, CheckCircle2, Database, HardDrive } from "lucide-react";
import { ALCANCE_LABEL, formatBytes, type SystemBackup } from "@/types/backup";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  backups: SystemBackup[];
  isLoading: boolean;
  onDownload: (storagePath: string, filename?: string) => void;
  onDelete: (id: string) => void;
}

export function BackupsTable({ backups, isLoading, onDownload, onDelete }: Props) {
  const [toDelete, setToDelete] = useState<SystemBackup | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando backups...
      </div>
    );
  }

  if (backups.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg">
        Aún no hay backups. Usa "Crear backup ahora" para generar el primero.
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Alcance</TableHead>
              <TableHead>Tamaño</TableHead>
              <TableHead>Contenido</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {backups.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">
                  {format(new Date(b.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                  {b.created_by_email && (
                    <div className="text-xs text-muted-foreground">{b.created_by_email}</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {b.alcance === "completo" ? (
                      <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Database className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="text-sm">{ALCANCE_LABEL[b.alcance]}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{formatBytes(b.tamano_bytes)}</TableCell>
                <TableCell>
                  <div className="text-xs space-y-0.5">
                    <div>
                      <span className="text-muted-foreground">BD:</span> {b.filas_count.toLocaleString()} filas /{" "}
                      {formatBytes(b.tamano_db_bytes)}
                    </div>
                    {b.alcance === "completo" && (
                      <div>
                        <span className="text-muted-foreground">Archivos:</span>{" "}
                        {b.archivos_count.toLocaleString()} / {formatBytes(b.tamano_files_bytes)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={b.origen === "manual" ? "secondary" : "outline"}>
                    {b.origen === "manual" ? "Manual" : "Programado"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {b.estado === "en_progreso" && (
                    <Badge variant="secondary" className="gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> En progreso
                    </Badge>
                  )}
                  {b.estado === "completado" && (
                    <Badge className="gap-1 bg-green-600 hover:bg-green-600/90">
                      <CheckCircle2 className="h-3 w-3" /> Completado
                    </Badge>
                  )}
                  {b.estado === "fallido" && (
                    <Badge variant="destructive" className="gap-1" title={b.error_msg ?? ""}>
                      <AlertCircle className="h-3 w-3" /> Fallido
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {b.estado === "completado" && b.storage_path && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDownload(b.storage_path!)}
                        title="Descargar"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {b.estado !== "en_progreso" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setToDelete(b)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Eliminar backup"
        description={`Se eliminará permanentemente el backup del ${
          toDelete ? format(new Date(toDelete.created_at), "dd MMM yyyy HH:mm", { locale: es }) : ""
        } y su archivo asociado. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={() => {
          if (toDelete) onDelete(toDelete.id);
          setToDelete(null);
        }}
      />
    </>
  );
}
