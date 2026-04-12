import { ChevronDown, Download, Award, FileWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCertificadosByMatricula } from "@/hooks/useCertificados";
import { descargarCertificadoPdf } from "@/utils/certificadoPdf";
import { useState } from "react";
import type { CertificadoGenerado } from "@/types/certificado";

interface Props {
  matriculaId: string;
}

export function HistorialVersiones({ matriculaId }: Props) {
  const [open, setOpen] = useState(false);
  const { data: certificados = [] } = useCertificadosByMatricula(matriculaId);

  if (certificados.length === 0) return null;

  const sorted = [...certificados].sort((a, b) => b.version - a.version);

  const handleDescargar = (cert: CertificadoGenerado) => {
    descargarCertificadoPdf(cert.svgFinal, cert.codigo);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1">
          <span>Historial de versiones ({certificados.length})</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-1">
        {sorted.map((cert) => (
          <div key={cert.id} className="border rounded-md p-3 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-foreground">{cert.codigo}</span>
                <Badge
                  variant="outline"
                  className={
                    cert.estado === "generado"
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : "bg-gray-100 text-gray-700 border-gray-200"
                  }
                >
                  {cert.estado === "generado" ? (
                    <Award className="h-3 w-3 mr-1" />
                  ) : (
                    <FileWarning className="h-3 w-3 mr-1" />
                  )}
                  v{cert.version} · {cert.estado}
                </Badge>
                {cert.autorizadoExcepcional && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                    Excepcional
                  </Badge>
                )}
              </div>
              <div className="text-muted-foreground">
                {new Date(cert.fechaGeneracion).toLocaleDateString("es-CO")}
                {cert.motivoRevocacion && (
                  <> · Motivo: {cert.motivoRevocacion}</>
                )}
              </div>
            </div>
            <Button size="sm" variant="ghost" className="h-7" onClick={() => handleDescargar(cert)}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
