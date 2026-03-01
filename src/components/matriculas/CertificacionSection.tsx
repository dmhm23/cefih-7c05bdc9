import { useState } from "react";
import { Award, Download, ShieldAlert, ShieldCheck, FileWarning, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditableField } from "@/components/shared/EditableField";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCertificadosByMatricula, useGenerarCertificado } from "@/hooks/useCertificados";
import { usePlantillaActiva } from "@/hooks/usePlantillas";
import { useSolicitarExcepcion } from "@/hooks/useExcepcionesCertificado";
import { evaluarElegibilidad, construirDiccionarioTokens, reemplazarTokens, generarCodigoCertificado } from "@/utils/certificadoGenerator";
import { descargarCertificadoPdf } from "@/utils/certificadoPdf";
import { useToast } from "@/hooks/use-toast";
import type { Matricula } from "@/types/matricula";
import type { Persona } from "@/types/persona";
import type { Curso } from "@/types/curso";
import type { FormatoFormacion } from "@/types/formatoFormacion";
import type { EstadoCertificado } from "@/types/certificado";

interface Props {
  matricula: Matricula;
  persona?: Persona;
  curso?: Curso;
  formatosDinamicos?: FormatoFormacion[];
  onFieldChange: (field: string, value: string | number) => void;
  getValue: (field: keyof Matricula) => string;
}

const ESTADO_CONFIG: Record<EstadoCertificado, { label: string; icon: React.ElementType; className: string }> = {
  elegible: { label: "Elegible", icon: ShieldCheck, className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  generado: { label: "Generado", icon: Award, className: "bg-blue-100 text-blue-700 border-blue-200" },
  bloqueado: { label: "Bloqueado", icon: ShieldAlert, className: "bg-red-100 text-red-700 border-red-200" },
  revocado: { label: "Revocado", icon: FileWarning, className: "bg-gray-100 text-gray-700 border-gray-200" },
};

export function CertificacionSection({ matricula, persona, curso, formatosDinamicos, onFieldChange, getValue }: Props) {
  const { toast } = useToast();
  const [excepcionOpen, setExcepcionOpen] = useState(false);
  const [excepcionMotivo, setExcepcionMotivo] = useState("");
  const [generando, setGenerando] = useState(false);

  const { data: certificados = [] } = useCertificadosByMatricula(matricula.id);
  const { data: plantillaActiva } = usePlantillaActiva();
  const generarCertificado = useGenerarCertificado();
  const solicitarExcepcion = useSolicitarExcepcion();

  const certificadoExistente = certificados.find(c => c.estado === 'generado');
  const certificadoRevocado = certificados.find(c => c.estado === 'revocado');
  const { elegible, motivos } = evaluarElegibilidad(matricula, formatosDinamicos);

  // Determine display state
  let estadoDisplay: EstadoCertificado;
  if (certificadoExistente) {
    estadoDisplay = 'generado';
  } else if (certificadoRevocado && !certificadoExistente) {
    estadoDisplay = 'revocado';
  } else if (elegible) {
    estadoDisplay = 'elegible';
  } else {
    estadoDisplay = 'bloqueado';
  }

  const config = ESTADO_CONFIG[estadoDisplay];
  const Icon = config.icon;

  const handleGenerar = async () => {
    if (!persona || !curso) {
      toast({ title: "Datos incompletos", description: "No se encontró persona o curso.", variant: "destructive" });
      return;
    }
    if (!plantillaActiva) {
      toast({ title: "Sin plantilla activa", description: "No hay plantilla SVG activa para generar el certificado.", variant: "destructive" });
      return;
    }

    setGenerando(true);
    try {
      const codigo = generarCodigoCertificado(curso, matricula, certificados.length + 1);
      const diccionario = construirDiccionarioTokens(persona, curso, matricula);
      diccionario.codigoCertificado = codigo;
      const svgFinal = reemplazarTokens(plantillaActiva.svgRaw, diccionario);

      await generarCertificado.mutateAsync({
        matriculaId: matricula.id,
        cursoId: curso.id,
        personaId: persona.id,
        plantillaId: plantillaActiva.id,
        tipoCertificadoId: '',
        svgFinal,
        snapshotDatos: diccionario,
        codigo,
      });

      onFieldChange("fechaGeneracionCertificado", new Date().toISOString().split('T')[0]);
      toast({ title: "Certificado generado", description: `Código: ${codigo}` });
    } catch {
      toast({ title: "Error al generar certificado", variant: "destructive" });
    } finally {
      setGenerando(false);
    }
  };

  const handleDescargar = () => {
    if (!certificadoExistente) return;
    descargarCertificadoPdf(certificadoExistente.svgFinal, certificadoExistente.codigo);
  };

  const handleSolicitarExcepcion = async () => {
    if (!excepcionMotivo.trim()) {
      toast({ title: "Ingrese un motivo", variant: "destructive" });
      return;
    }
    try {
      await solicitarExcepcion.mutateAsync({
        matriculaId: matricula.id,
        solicitadoPor: "admin",
        motivo: excepcionMotivo,
      });
      toast({ title: "Solicitud de excepción enviada" });
      setExcepcionOpen(false);
      setExcepcionMotivo("");
    } catch {
      toast({ title: "Error al solicitar excepción", variant: "destructive" });
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Certificación
        </h3>
        <Badge className={config.className}>
          <Icon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      </div>

      {/* Motivos de bloqueo */}
      {estadoDisplay === 'bloqueado' && motivos.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 space-y-1">
          <p className="text-xs font-medium text-destructive">No se puede generar certificado:</p>
          <ul className="text-xs text-destructive/80 list-disc pl-4 space-y-0.5">
            {motivos.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        {estadoDisplay === 'elegible' && (
          <Button size="sm" onClick={handleGenerar} disabled={generando}>
            {generando ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Award className="h-4 w-4 mr-1" />}
            Generar Certificado
          </Button>
        )}
        {certificadoExistente && (
          <Button size="sm" variant="outline" onClick={handleDescargar}>
            <Download className="h-4 w-4 mr-1" />
            Descargar PDF
          </Button>
        )}
        {estadoDisplay === 'bloqueado' && (
          <Button size="sm" variant="secondary" onClick={() => setExcepcionOpen(true)}>
            <ShieldAlert className="h-4 w-4 mr-1" />
            Solicitar Excepción
          </Button>
        )}
      </div>

      {/* Info del certificado generado */}
      {certificadoExistente && (
        <div className="text-xs text-muted-foreground">
          Código: <span className="font-mono font-medium text-foreground">{certificadoExistente.codigo}</span>
          {' · '}Versión: {certificadoExistente.version}
        </div>
      )}

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-3">
        <EditableField
          label="Fecha de generación"
          value={getValue("fechaGeneracionCertificado")}
          onChange={(v) => onFieldChange("fechaGeneracionCertificado", v)}
          type="date"
        />
        <EditableField
          label="Fecha de entrega"
          value={getValue("fechaEntregaCertificado")}
          onChange={(v) => onFieldChange("fechaEntregaCertificado", v)}
          type="date"
        />
      </div>

      {/* Dialog excepción */}
      <Dialog open={excepcionOpen} onOpenChange={setExcepcionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Excepción</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Explique por qué se debe generar el certificado a pesar de los requisitos pendientes.
            </p>
            <Textarea
              value={excepcionMotivo}
              onChange={(e) => setExcepcionMotivo(e.target.value)}
              placeholder="Motivo de la excepción..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExcepcionOpen(false)}>Cancelar</Button>
            <Button onClick={handleSolicitarExcepcion} disabled={solicitarExcepcion.isPending}>
              Enviar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
