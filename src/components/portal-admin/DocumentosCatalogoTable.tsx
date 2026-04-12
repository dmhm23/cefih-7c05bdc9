import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/shared/IconButton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Pencil, Trash2, Plus } from 'lucide-react';
import { PortalDocumentoConfigAdmin } from '@/types/portalAdmin';
import { resolveNivelCursoLabel } from '@/utils/resolveNivelLabel';
import { DocumentoConfigDialog } from './DocumentoConfigDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

const TIPO_LABELS: Record<string, string> = {
  firma_autorizacion: 'Firma / Autorización',
  evaluacion: 'Evaluación',
  formulario: 'Formulario',
  solo_lectura: 'Solo lectura',
};

interface Props {
  documentos: PortalDocumentoConfigAdmin[];
  onSave: (doc: PortalDocumentoConfigAdmin) => void;
  onDelete: (key: string) => void;
  onReorder: (keys: string[]) => void;
}

function SortableRow({
  doc,
  allDocs,
  onEdit,
  onDelete,
}: {
  doc: PortalDocumentoConfigAdmin;
  allDocs: PortalDocumentoConfigAdmin[];
  onEdit: (doc: PortalDocumentoConfigAdmin) => void;
  onDelete: (key: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: doc.key });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const nivelesActivos = doc.nivelesHabilitados.length === 0
    ? ['Todos']
    : doc.nivelesHabilitados.map(id => resolveNivelCursoLabel(id));

  const depNames = doc.dependeDe
    .map(k => allDocs.find(d => d.key === k)?.nombre || k)
    .join(', ');

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-10">
        <button {...attributes} {...listeners} className="cursor-grab p-1 text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell className="font-medium">{doc.nombre}</TableCell>
      <TableCell><Badge variant="outline">{TIPO_LABELS[doc.tipo] || doc.tipo}</Badge></TableCell>
      <TableCell className="text-center">{doc.requiereFirma ? 'Sí' : 'No'}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{depNames || '—'}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {nivelesActivos.includes('Todos') ? (
            <Badge variant="secondary" className="text-xs">Todos</Badge>
          ) : (
            nivelesActivos.map(n => <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>)
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <IconButton tooltip="Editar" className="h-8 w-8" onClick={() => onEdit(doc)}><Pencil className="h-4 w-4" /></IconButton>
          <IconButton tooltip="Eliminar" className="h-8 w-8" onClick={() => onDelete(doc.key)}><Trash2 className="h-4 w-4 text-destructive" /></IconButton>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function DocumentosCatalogoTable({ documentos, onSave, onDelete, onReorder }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<PortalDocumentoConfigAdmin | null>(null);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);

  const sorted = [...documentos].sort((a, b) => a.orden - b.orden);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex(d => d.key === active.id);
    const newIndex = sorted.findIndex(d => d.key === over.id);
    const reordered = arrayMove(sorted, oldIndex, newIndex);
    onReorder(reordered.map(d => d.key));
  };

  const handleEdit = (doc: PortalDocumentoConfigAdmin) => {
    setEditDoc(doc);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditDoc(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Agregar documento
        </Button>
      </div>

      <div className="rounded-md border">
        <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Firma</TableHead>
                <TableHead>Depende de</TableHead>
                <TableHead>Niveles</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <SortableContext items={sorted.map(d => d.key)} strategy={verticalListSortingStrategy}>
              <TableBody>
                {sorted.map(doc => (
                  <SortableRow key={doc.key} doc={doc} allDocs={sorted} onEdit={handleEdit} onDelete={setDeleteKey} />
                ))}
              </TableBody>
            </SortableContext>
          </Table>
        </DndContext>
      </div>

      <DocumentoConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        documento={editDoc}
        existingKeys={documentos.map(d => d.key)}
        allDocumentos={documentos}
        onSave={onSave}
      />

      <ConfirmDialog
        open={!!deleteKey}
        onOpenChange={(open) => { if (!open) setDeleteKey(null); }}
        title="Eliminar documento"
        description="¿Estás seguro de eliminar este documento del catálogo? Se eliminará también de las dependencias de otros documentos."
        onConfirm={() => { if (deleteKey) { onDelete(deleteKey); setDeleteKey(null); } }}
        variant="destructive"
      />
    </div>
  );
}
