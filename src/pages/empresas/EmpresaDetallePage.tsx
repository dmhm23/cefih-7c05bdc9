import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Building2, FileText, MapPin, Phone, Mail, User, Shield, Users, GraduationCap, DollarSign, Plus, Pencil, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useEmpresa, useUpdateEmpresa, useTarifasEmpresa, useCreateTarifa, useUpdateTarifa, useDeleteTarifa } from "@/hooks/useEmpresas";
import { useMatriculas } from "@/hooks/useMatriculas";
import { usePersonas } from "@/hooks/usePersonas";
import { useNivelesFormacion } from "@/hooks/useNivelesFormacion";
import { EditableField } from "@/components/shared/EditableField";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { Empresa, EmpresaFormData, ContactoEmpresa } from "@/types/empresa";
import { v4 as uuid } from "uuid";
import { SECTORES_ECONOMICOS, ARL_OPTIONS } from "@/data/formOptions";
import { ESTADO_MATRICULA_LABELS } from "@/types/matricula";
import { Combobox } from "@/components/ui/combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function EmpresaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string })?.from || "/empresas";
  const { toast } = useToast();

  const { data: empresa, isLoading } = useEmpresa(id || "");
  const updateEmpresa = useUpdateEmpresa();
  const { data: matriculas = [] } = useMatriculas();
  const { data: personas = [] } = usePersonas();
  const { data: niveles = [] } = useNivelesFormacion();
  const { data: tarifas = [] } = useTarifasEmpresa(id || "");
  const createTarifa = useCreateTarifa();
  const updateTarifa = useUpdateTarifa();
  const deleteTarifa = useDeleteTarifa();

  const [formData, setFormData] = useState<Partial<EmpresaFormData>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [contactos, setContactos] = useState<ContactoEmpresa[]>([]);
  const [tarifaDialogOpen, setTarifaDialogOpen] = useState(false);
  const [editingTarifaId, setEditingTarifaId] = useState<string | null>(null);
  const [tarifaNivelId, setTarifaNivelId] = useState("");
  const [tarifaValor, setTarifaValor] = useState("");
  const [deleteTarifaId, setDeleteTarifaId] = useState<string | null>(null);

  useEffect(() => {
    setFormData({});
    setIsDirty(false);
    if (empresa) {
      setContactos(empresa.contactos?.length ? [...empresa.contactos] : [
        { id: uuid(), nombre: empresa.personaContacto || "", telefono: empresa.telefonoContacto || "", email: empresa.emailContacto || "", esPrincipal: true }
      ]);
    }
  }, [empresa?.id]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Empresa no encontrada</p>
        <Button variant="link" onClick={() => navigate("/empresas")}>
          Volver al listado
        </Button>
      </div>
    );
  }

  // Estudiantes enviados
  const matriculasEmpresa = matriculas.filter(
    m => m.empresaId === empresa.id || m.empresaNit === empresa.nit
  );
  const personaIdsUnicos = [...new Set(matriculasEmpresa.map(m => m.personaId))];
  const cursosIdsUnicos = [...new Set(matriculasEmpresa.map(m => m.cursoId))];

  const handleFieldChange = (field: keyof EmpresaFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleContactoChange = (index: number, field: keyof Omit<ContactoEmpresa, 'id' | 'esPrincipal'>, value: string) => {
    setContactos(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
    setIsDirty(true);
  };

  const handleAddContacto = () => {
    setContactos(prev => [...prev, { id: uuid(), nombre: "", telefono: "", email: "", esPrincipal: false }]);
    setIsDirty(true);
  };

  const handleRemoveContacto = (index: number) => {
    setContactos(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some(c => c.esPrincipal)) {
        updated[0].esPrincipal = true;
      }
      return updated;
    });
    setIsDirty(true);
  };

  const handleSetPrincipal = (index: number) => {
    setContactos(prev => prev.map((c, i) => ({ ...c, esPrincipal: i === index })));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      const principal = contactos.find(c => c.esPrincipal) || contactos[0];
      await updateEmpresa.mutateAsync({
        id: empresa.id,
        data: {
          ...formData,
          contactos,
          personaContacto: principal?.nombre || "",
          telefonoContacto: principal?.telefono || "",
          emailContacto: principal?.email || "",
        }
      });
      toast({ title: "Cambios guardados correctamente" });
      setFormData({});
      setIsDirty(false);
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    }
  };

  const handleCancel = () => {
    setFormData({});
    setIsDirty(false);
    if (empresa) {
      setContactos(empresa.contactos?.length ? [...empresa.contactos] : []);
    }
  };

  const getValue = <K extends keyof Empresa>(field: K): Empresa[K] => {
    return (formData[field as keyof EmpresaFormData] as Empresa[K]) ?? empresa[field];
  };

  const getDisplayLabel = (value: string, options: readonly { value: string; label: string }[]) => {
    return options.find(o => o.value === value)?.label || value;
  };

  const cursosOptions = cursos.map(c => ({ value: c.id, label: c.nombre }));

  const handleOpenTarifaDialog = (tarifaId?: string) => {
    if (tarifaId) {
      const tarifa = tarifas.find(t => t.id === tarifaId);
      if (tarifa) {
        setEditingTarifaId(tarifaId);
        setTarifaCursoId(tarifa.cursoId);
        setTarifaValor(tarifa.valor.toString());
      }
    } else {
      setEditingTarifaId(null);
      setTarifaCursoId("");
      setTarifaValor("");
    }
    setTarifaDialogOpen(true);
  };

  const handleSaveTarifa = async () => {
    if (!tarifaCursoId || !tarifaValor) {
      toast({ title: "Complete todos los campos", variant: "destructive" });
      return;
    }
    const curso = cursos.find(c => c.id === tarifaCursoId);
    try {
      if (editingTarifaId) {
        await updateTarifa.mutateAsync({
          id: editingTarifaId,
          data: { cursoId: tarifaCursoId, cursoNombre: curso?.nombre || "", valor: Number(tarifaValor) },
        });
        toast({ title: "Tarifa actualizada" });
      } else {
        await createTarifa.mutateAsync({
          empresaId: empresa.id,
          cursoId: tarifaCursoId,
          cursoNombre: curso?.nombre || "",
          valor: Number(tarifaValor),
        });
        toast({ title: "Tarifa creada" });
      }
      setTarifaDialogOpen(false);
    } catch {
      toast({ title: "Error al guardar tarifa", variant: "destructive" });
    }
  };

  const handleDeleteTarifa = async () => {
    if (!deleteTarifaId) return;
    try {
      await deleteTarifa.mutateAsync(deleteTarifaId);
      toast({ title: "Tarifa eliminada" });
    } catch {
      toast({ title: "Error al eliminar tarifa", variant: "destructive" });
    }
    setDeleteTarifaId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(fromPath)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold">{getValue("nombreEmpresa")}</h1>
          <p className="text-sm text-muted-foreground">NIT: {getValue("nit")}</p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border rounded-lg p-3 text-center">
          <Users className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{personaIdsUnicos.length}</p>
          <p className="text-xs text-muted-foreground">Estudiantes únicos</p>
        </div>
        <div className="border rounded-lg p-3 text-center">
          <FileText className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{matriculasEmpresa.length}</p>
          <p className="text-xs text-muted-foreground">Matrículas</p>
        </div>
        <div className="border rounded-lg p-3 text-center">
          <GraduationCap className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{cursosIdsUnicos.length}</p>
          <p className="text-xs text-muted-foreground">Cursos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Información General */}
        <div className="border rounded-lg p-4 shadow-sm space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Información General
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <EditableField
              label="Nombre Empresa"
              value={getValue("nombreEmpresa")}
              onChange={v => handleFieldChange("nombreEmpresa", v)}
              icon={Building2}
            />
            <EditableField
              label="NIT"
              value={getValue("nit")}
              onChange={v => handleFieldChange("nit", v)}
              icon={FileText}
            />
            <EditableField
              label="Representante Legal"
              value={getValue("representanteLegal")}
              onChange={v => handleFieldChange("representanteLegal", v)}
              icon={User}
            />
            <EditableField
              label="Sector Económico"
              value={getValue("sectorEconomico")}
              displayValue={getDisplayLabel(getValue("sectorEconomico"), SECTORES_ECONOMICOS)}
              onChange={v => handleFieldChange("sectorEconomico", v)}
              type="select"
              options={[...SECTORES_ECONOMICOS]}
              icon={Building2}
            />
            <EditableField
              label="ARL"
              value={getValue("arl")}
              displayValue={getDisplayLabel(getValue("arl"), ARL_OPTIONS)}
              onChange={v => handleFieldChange("arl", v)}
              type="select"
              options={[...ARL_OPTIONS]}
              icon={Shield}
            />
            <EditableField
              label="Dirección"
              value={getValue("direccion")}
              onChange={v => handleFieldChange("direccion", v)}
              icon={MapPin}
            />
            <EditableField
              label="Teléfono Empresa"
              value={getValue("telefonoEmpresa")}
              onChange={v => handleFieldChange("telefonoEmpresa", v)}
              icon={Phone}
            />
          </div>
        </div>

        {/* Personas de Contacto */}
        <div className="border rounded-lg p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Personas de Contacto
            </h3>
          </div>
          {contactos.map((contacto, index) => (
            <div key={contacto.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Contacto {index + 1}</span>
                  {contacto.esPrincipal ? (
                    <Badge variant="default" className="text-[10px] h-5">Principal</Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[10px] text-muted-foreground px-1.5"
                      onClick={() => handleSetPrincipal(index)}
                    >
                      <Star className="h-3 w-3 mr-0.5" />
                      Principal
                    </Button>
                  )}
                </div>
                {contactos.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveContacto(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Nombre</label>
                  <Input
                    value={contacto.nombre}
                    onChange={e => handleContactoChange(index, "nombre", e.target.value)}
                    placeholder="Nombre completo"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Teléfono</label>
                  <Input
                    value={contacto.telefono}
                    onChange={e => handleContactoChange(index, "telefono", e.target.value)}
                    placeholder="3001234567"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Email</label>
                  <Input
                    type="email"
                    value={contacto.email}
                    onChange={e => handleContactoChange(index, "email", e.target.value)}
                    placeholder="contacto@empresa.com"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleAddContacto}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Agregar contacto
          </Button>
        </div>
      </div>

      {/* Estudiantes enviados */}
      <div className="border rounded-lg p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Estudiantes Enviados
        </h3>
        {matriculasEmpresa.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay estudiantes asociados a esta empresa.</p>
        ) : (
          <div className="overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Fecha matrícula</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matriculasEmpresa.map(m => {
                  const persona = personas.find(p => p.id === m.personaId);
                  const curso = cursos.find(c => c.id === m.cursoId);
                  return (
                    <TableRow
                      key={m.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/matriculas/${m.id}`, { state: { from: `/empresas/${empresa.id}`, fromLabel: "Empresa" } })}
                    >
                      <TableCell className="font-medium">
                        {persona ? `${persona.nombres} ${persona.apellidos}` : "—"}
                      </TableCell>
                      <TableCell>{persona?.numeroDocumento || "—"}</TableCell>
                      <TableCell>{curso?.nombre || "—"}</TableCell>
                      <TableCell>
                        {format(new Date(m.createdAt), "dd/MM/yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={m.estado} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Tarifas especiales */}
      <div className="border rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tarifas Especiales
          </h3>
          <Button size="sm" variant="outline" onClick={() => handleOpenTarifaDialog()}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar tarifa
          </Button>
        </div>
        {tarifas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay tarifas especiales registradas.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tarifas.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{t.cursoNombre}</TableCell>
                  <TableCell className="font-medium">
                    ${t.valor.toLocaleString("es-CO")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenTarifaDialog(t.id)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarifaId(t.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {isDirty && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-background border rounded-lg shadow-lg p-3">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateEmpresa.isPending}>
            {updateEmpresa.isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      )}

      {/* Dialog agregar/editar tarifa */}
      <Dialog open={tarifaDialogOpen} onOpenChange={setTarifaDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTarifaId ? "Editar Tarifa" : "Agregar Tarifa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Curso</Label>
              <Combobox
                options={cursosOptions}
                value={tarifaCursoId}
                onValueChange={setTarifaCursoId}
                placeholder="Seleccionar curso..."
                searchPlaceholder="Buscar curso..."
                emptyMessage="Curso no encontrado"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor ($)</Label>
              <Input
                type="number"
                value={tarifaValor}
                onChange={e => setTarifaValor(e.target.value)}
                placeholder="350000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarifaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveTarifa} disabled={createTarifa.isPending || updateTarifa.isPending}>
              {editingTarifaId ? "Guardar" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarifaId}
        onOpenChange={open => !open && setDeleteTarifaId(null)}
        title="¿Eliminar tarifa?"
        description="Esta acción eliminará la tarifa especial."
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleDeleteTarifa}
      />
    </div>
  );
}
