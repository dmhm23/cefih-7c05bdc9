import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Receipt, CreditCard, Building2, User, Phone, Mail, MapPin, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActividadCarteraSection } from "@/components/cartera/ActividadCarteraSection";
import { CrearFacturaDialog } from "@/components/cartera/CrearFacturaDialog";
import { RegistrarPagoDialog } from "@/components/cartera/RegistrarPagoDialog";
import { EditarFacturaDialog } from "@/components/cartera/EditarFacturaDialog";
import { EditarPagoDialog } from "@/components/cartera/EditarPagoDialog";
import { useGrupoCartera, useResponsablePago, useFacturasByGrupo, usePagosByGrupo } from "@/hooks/useCartera";
import { useMatriculas } from "@/hooks/useMatriculas";
import { usePersonas } from "@/hooks/usePersonas";
import { useCursos } from "@/hooks/useCursos";
import {
  TIPO_RESPONSABLE_LABELS,
  METODO_PAGO_LABELS,
  Factura,
  RegistroPago,
} from "@/types/cartera";
import { format } from "date-fns";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(v);

export default function GrupoCarteraDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: grupo, isLoading: loadingGrupo } = useGrupoCartera(id!);
  const { data: responsable } = useResponsablePago(grupo?.responsablePagoId || "");
  const { data: facturas = [] } = useFacturasByGrupo(id!);
  const { data: pagos = [] } = usePagosByGrupo(id!);
  const { data: allMatriculas = [] } = useMatriculas();
  const { data: personas = [] } = usePersonas();
  const { data: cursos = [] } = useCursos();

  const [showCrearFactura, setShowCrearFactura] = useState(false);
  const [showRegistrarPago, setShowRegistrarPago] = useState(false);
  const [editingFactura, setEditingFactura] = useState<Factura | null>(null);
  const [editingPago, setEditingPago] = useState<RegistroPago | null>(null);

  const matriculasGrupo = useMemo(
    () => allMatriculas.filter(m => grupo?.matriculaIds.includes(m.id)),
    [allMatriculas, grupo]
  );

  const facturasVencidas = useMemo(() => {
    const now = new Date();
    return facturas.filter(f => f.estado !== 'pagada' && new Date(f.fechaVencimiento) < now);
  }, [facturas]);

  const getPersona = (personaId: string) => personas.find(p => p.id === personaId);
  const getCurso = (cursoId: string) => cursos.find(c => c.id === cursoId);

  if (loadingGrupo || !grupo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/cartera")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{responsable?.nombre || "Grupo de Cartera"}</h1>
          <div className="flex items-center gap-2 mt-1">
            {responsable && (
              <Badge variant="outline">{TIPO_RESPONSABLE_LABELS[responsable.tipo]}</Badge>
            )}
            <StatusBadge status={grupo.estado} />
          </div>
        </div>
      </div>

      {/* Alerta de vencimiento */}
      {facturasVencidas.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {facturasVencidas.length === 1
              ? `La factura ${facturasVencidas[0].numeroFactura} está vencida.`
              : `${facturasVencidas.length} facturas están vencidas.`
            }
            {" "}Saldo pendiente: {formatCurrency(grupo.saldo)}.
          </AlertDescription>
        </Alert>
      )}

      {/* Info general + Resumen financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Contacto */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Información de Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {responsable?.nit && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium text-foreground">NIT:</span> {responsable.nit}
              </div>
            )}
            {responsable?.contactoNombre && (
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {responsable.contactoNombre}
              </div>
            )}
            {responsable?.contactoTelefono && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                {responsable.contactoTelefono}
              </div>
            )}
            {responsable?.contactoEmail && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                {responsable.contactoEmail}
              </div>
            )}
            {responsable?.direccionFacturacion && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {responsable.direccionFacturacion}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen financiero */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Resumen Financiero</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor Total</span>
              <span className="font-semibold">{formatCurrency(grupo.totalValor)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Abonado</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(grupo.totalAbonos)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Saldo Pendiente</span>
              <span className={`font-bold text-lg ${grupo.saldo > 0 ? "text-destructive" : "text-emerald-600"}`}>
                {formatCurrency(grupo.saldo)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Estadísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Matrículas</span>
              <span className="font-semibold">{grupo.matriculaIds.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Facturas</span>
              <span className="font-semibold">{facturas.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pagos Registrados</span>
              <span className="font-semibold">{pagos.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matrículas asociadas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matrículas Asociadas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Abono</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matriculasGrupo.map(m => {
                const persona = getPersona(m.personaId);
                const curso = getCurso(m.cursoId);
                const saldo = (m.valorCupo || 0) - (m.abono || 0);
                return (
                  <TableRow
                    key={m.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/matriculas/${m.id}`)}
                  >
                    <TableCell>
                      <div className="font-medium">
                        {persona ? `${persona.nombres} ${persona.apellidos}` : m.personaId}
                      </div>
                      <div className="text-xs text-muted-foreground">{persona?.numeroDocumento}</div>
                    </TableCell>
                    <TableCell className="text-sm">{curso?.nombre || m.cursoId}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(m.valorCupo || 0)}</TableCell>
                    <TableCell className="text-emerald-600">{formatCurrency(m.abono || 0)}</TableCell>
                    <TableCell className={saldo > 0 ? "text-destructive font-semibold" : ""}>
                      {formatCurrency(saldo)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={m.pagado ? "pagado" : "pendiente"} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {matriculasGrupo.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No hay matrículas asociadas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Facturación */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Facturación</CardTitle>
          <Button size="sm" onClick={() => setShowCrearFactura(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Registrar Factura
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Factura</TableHead>
                <TableHead>Emisión</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturas.map(f => {
                const isOverdue = f.estado !== 'pagada' && new Date(f.fechaVencimiento) < new Date();
                return (
                  <TableRow key={f.id} className={`cursor-pointer ${isOverdue ? "bg-red-50/50" : ""}`} onClick={() => setEditingFactura(f)}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-1.5">
                        {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                        {f.numeroFactura}
                      </span>
                    </TableCell>
                    <TableCell>{f.fechaEmision}</TableCell>
                    <TableCell className={isOverdue ? "text-destructive font-medium" : ""}>{f.fechaVencimiento}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(f.total)}</TableCell>
                    <TableCell><StatusBadge status={f.estado === "pagada" ? "pagada" : f.estado === "parcial" ? "parcial" : "pendiente"} /></TableCell>
                  </TableRow>
                );
              })}
              {facturas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay facturas registradas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Historial de Pagos</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowRegistrarPago(true)} className="gap-1.5">
            <CreditCard className="h-4 w-4" />
            Registrar Pago
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Factura</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Observaciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagos.map(p => {
                const factura = facturas.find(f => f.id === p.facturaId);
                return (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => setEditingPago(p)}>
                    <TableCell>{p.fechaPago}</TableCell>
                    <TableCell className="font-medium">{factura?.numeroFactura || "—"}</TableCell>
                    <TableCell className="font-medium text-emerald-600">{formatCurrency(p.valorPago)}</TableCell>
                    <TableCell><Badge variant="outline">{METODO_PAGO_LABELS[p.metodoPago]}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {p.observaciones || "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {pagos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay pagos registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Seguimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seguimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <ActividadCarteraSection grupoCarteraId={id!} />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CrearFacturaDialog
        open={showCrearFactura}
        onOpenChange={setShowCrearFactura}
        grupoCarteraId={id!}
        matriculas={matriculasGrupo}
      />
      <RegistrarPagoDialog
        open={showRegistrarPago}
        onOpenChange={setShowRegistrarPago}
        facturas={facturas}
      />
    </div>
  );
}
