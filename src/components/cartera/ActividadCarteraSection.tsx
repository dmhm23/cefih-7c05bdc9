import { useState } from "react";
import { Phone, Handshake, MessageSquare, Bot, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActividadesCartera, useActividadesByFactura, useRegistrarActividad } from "@/hooks/useCartera";
import { TipoActividadCartera, TIPO_ACTIVIDAD_LABELS } from "@/types/cartera";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const TIPO_ICONS: Record<TipoActividadCartera, React.ElementType> = {
  llamada: Phone,
  promesa_pago: Handshake,
  comentario: MessageSquare,
  sistema: Bot,
};

const TIPO_COLORS: Record<TipoActividadCartera, string> = {
  llamada: "bg-blue-100 text-blue-700 border-blue-200",
  promesa_pago: "bg-amber-100 text-amber-700 border-amber-200",
  comentario: "bg-slate-100 text-slate-700 border-slate-200",
  sistema: "bg-purple-100 text-purple-700 border-purple-200",
};

const MANUAL_TIPOS: TipoActividadCartera[] = ["llamada", "promesa_pago", "comentario"];

interface ActividadCarteraSectionProps {
  grupoCarteraId: string;
  facturaId?: string;
}

export function ActividadCarteraSection({ grupoCarteraId, facturaId }: ActividadCarteraSectionProps) {
  const grupoQuery = useActividadesCartera(facturaId ? "" : grupoCarteraId);
  const facturaQuery = useActividadesByFactura(facturaId || "");

  const actividades = facturaId ? (facturaQuery.data || []) : (grupoQuery.data || []);
  const isLoading = facturaId ? facturaQuery.isLoading : grupoQuery.isLoading;

  const registrar = useRegistrarActividad();

  const [showForm, setShowForm] = useState(false);
  const [tipo, setTipo] = useState<TipoActividadCartera>("comentario");
  const [descripcion, setDescripcion] = useState("");

  const handleSubmit = () => {
    if (!descripcion.trim()) return;
    registrar.mutate(
      { grupoCarteraId, facturaId, tipo, descripcion: descripcion.trim() },
      {
        onSuccess: () => {
          setDescripcion("");
          setShowForm(false);
          toast.success("Actividad registrada");
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Agregar actividad
        </Button>
      )}

      {showForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="flex items-center gap-3">
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoActividadCartera)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MANUAL_TIPOS.map((t) => {
                  const Icon = TIPO_ICONS[t];
                  return (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        {TIPO_ACTIVIDAD_LABELS[t]}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Descripción de la actividad..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={2}
          />
          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setDescripcion(""); }}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!descripcion.trim() || registrar.isPending} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              Registrar
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
        </div>
      ) : actividades.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No hay actividades registradas.</p>
      ) : (
        <div className="relative space-y-0">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
          {actividades.map((act) => {
            const Icon = TIPO_ICONS[act.tipo];
            return (
              <div key={act.id} className="relative flex gap-3 py-3 pl-0">
                <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${TIPO_COLORS[act.tipo]}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${TIPO_COLORS[act.tipo]}`}>
                      {TIPO_ACTIVIDAD_LABELS[act.tipo]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(act.fecha), "d MMM yyyy, HH:mm", { locale: es })}
                    </span>
                    {act.usuario && (
                      <span className="text-xs text-muted-foreground">• {act.usuario}</span>
                    )}
                  </div>
                  <p className="text-sm mt-0.5">{act.descripcion}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
