import { useState, useMemo } from "react";
import { ChevronDown, Plus, CreditCard, FileText, AlertTriangle, Pencil, Paperclip, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RegistrarPagoDialog } from "./RegistrarPagoDialog";
import { EditarPagoDialog } from "./EditarPagoDialog";
import { EditarFacturaDialog } from "./EditarFacturaDialog";
import { ActividadCarteraSection } from "./ActividadCarteraSection";
import { ArchivoPreviewDialog } from "./ArchivoPreviewDialog";
import { usePagosByFactura } from "@/hooks/useCartera";
import { Factura, RegistroPago, METODO_PAGO_LABELS } from "@/types/cartera";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { fmtDateLocal } from "@/utils/dateUtils";
import type { Matricula } from "@/types/matricula";
import type { Persona } from "@/types/persona";
import type { Curso } from "@/types/curso";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(v);

interface FacturaCardProps {
  factura: Factura;
  grupoCarteraId: string;
  matriculas: Matricula[];
  personas: Persona[];
  cursos: Curso[];
}

export function FacturaCard({ factura, grupoCarteraId, matriculas, personas, cursos }: FacturaCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showRegistrarPago, setShowRegistrarPago] = useState(false);
  const [editingPago, setEditingPago] = useState<RegistroPago | null>(null);
  const [showEditFactura, setShowEditFactura] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewNombre, setPreviewNombre] = useState("");

  const { data: pagos = [] } = usePagosByFactura(factura.id);

  const isOverdue = factura.estado !== "pagada" && (() => { const [y,m,d] = factura.fechaVencimiento.split('-').map(Number); return new Date(y, m-1, d); })() < new Date();

  const totalPagado = useMemo(() => pagos.reduce((s, p) => s + p.valorPago, 0), [pagos]);
  const saldoPendiente = factura.total - totalPagado;

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className={`border rounded-lg overflow-hidden ${isOverdue ? "border-destructive/50 bg-destructive/5" : ""}`}>
          {/* Header */}
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left">
              <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`} />
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="font-semibold text-sm">{factura.numeroFactura}</span>
                {factura.archivoFactura && <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                <StatusBadge status={factura.estado === "pagada" ? "pagada" : factura.estado === "parcial" ? "parcial" : "pendiente"} />
              </div>
              <div className="flex items-center gap-4 text-sm shrink-0">
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-muted-foreground">Emitida</div>
                  <div>{fmtDateLocal(factura.fechaEmision, "d MMM yyyy", es)}</div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-muted-foreground">Vence</div>
                  <div className={isOverdue ? "text-destructive font-medium" : ""}>
                    {fmtDateLocal(factura.fechaVencimiento, "d MMM yyyy", es)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="font-semibold">{formatCurrency(factura.total)}</div>
                </div>
                {saldoPendiente > 0 && (
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Saldo</div>
                    <div className="font-semibold text-destructive">{formatCurrency(saldoPendiente)}</div>
                  </div>
                )}
              </div>
            </button>
          </CollapsibleTrigger>

          {/* Content */}
          <CollapsibleContent>
            <Separator />
            <div className="p-4 space-y-5">
              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowEditFactura(true)} className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  Editar Factura
                </Button>
                {factura.archivoFactura && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => { setPreviewUrl(factura.archivoFactura!); setPreviewNombre(`Factura ${factura.numeroFactura}`); }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver Factura
                  </Button>
                )}
              </div>

              {/* Pagos section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    Pagos
                    <Badge variant="secondary" className="text-xs">{pagos.length}</Badge>
                  </h4>
                  {factura.estado !== "pagada" && (
                    <Button size="sm" variant="outline" onClick={() => setShowRegistrarPago(true)} className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Registrar Pago
                    </Button>
                  )}
                </div>
                {pagos.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Observaciones</TableHead>
                          <TableHead className="w-[60px]">Soporte</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagos.map(p => (
                          <TableRow key={p.id} className="cursor-pointer" onClick={() => setEditingPago(p)}>
                            <TableCell className="text-sm">
                              {fmtDateLocal(p.fechaPago, "d MMM yyyy", es)}
                            </TableCell>
                            <TableCell className="font-medium text-emerald-600">{formatCurrency(p.valorPago)}</TableCell>
                            <TableCell><Badge variant="outline">{METODO_PAGO_LABELS[p.metodoPago]}</Badge></TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{p.observaciones || "—"}</TableCell>
                            <TableCell>
                              {p.soportePago ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => { e.stopPropagation(); setPreviewUrl(p.soportePago!); setPreviewNombre(`Comprobante - ${formatCurrency(p.valorPago)}`); }}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4 border rounded-md">Sin pagos registrados.</p>
                )}
                {/* Resumen pagos */}
                <div className="flex items-center gap-4 text-sm px-1">
                  <span className="text-muted-foreground">Pagado: <span className="font-medium text-emerald-600">{formatCurrency(totalPagado)}</span></span>
                  {saldoPendiente > 0 && (
                    <span className="text-muted-foreground">Pendiente: <span className="font-medium text-destructive">{formatCurrency(saldoPendiente)}</span></span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Seguimiento section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Seguimiento</h4>
                <ActividadCarteraSection grupoCarteraId={grupoCarteraId} facturaId={factura.id} />
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Dialogs */}
      <RegistrarPagoDialog
        open={showRegistrarPago}
        onOpenChange={setShowRegistrarPago}
        factura={factura}
      />
      <EditarPagoDialog
        open={!!editingPago}
        onOpenChange={(open) => !open && setEditingPago(null)}
        pago={editingPago}
      />
      <EditarFacturaDialog
        open={showEditFactura}
        onOpenChange={setShowEditFactura}
        factura={factura}
        matriculas={matriculas}
        personas={personas}
        cursos={cursos}
      />
      <ArchivoPreviewDialog
        open={!!previewUrl}
        onOpenChange={(open) => !open && setPreviewUrl(null)}
        url={previewUrl}
        nombre={previewNombre}
      />
    </>
  );
}
