import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { PenTool, RotateCcw, Save, CheckCircle2 } from "lucide-react";

interface FirmaCapturaProps {
  firmaExistente?: string;
  onGuardar: (firmaBase64: string) => void;
  isPending?: boolean;
  disabled?: boolean;
}

export function FirmaCaptura({ firmaExistente, onGuardar, isPending, disabled }: FirmaCapturaProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    sigRef.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const base64 = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
      onGuardar(base64);
    }
  };

  if (firmaExistente) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">Firma capturada</span>
        </div>
        <div className="border rounded-lg p-2 bg-background">
          <img src={firmaExistente} alt="Firma capturada" className="max-h-24 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <PenTool className="h-4 w-4" />
        <span>Firme en el recuadro a continuación</span>
      </div>
      <div className="border-2 border-dashed rounded-lg bg-background cursor-crosshair">
        <SignatureCanvas
          ref={sigRef}
          canvasProps={{
            className: "w-full",
            style: { width: "100%", height: "150px" },
          }}
          penColor="black"
          backgroundColor="white"
          onBegin={() => setIsEmpty(false)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleClear} disabled={isEmpty || disabled}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Limpiar
        </Button>
        <Button type="button" size="sm" onClick={handleSave} disabled={isEmpty || isPending || disabled}>
          <Save className="h-3.5 w-3.5 mr-1" />
          {isPending ? "Guardando..." : "Guardar Firma"}
        </Button>
      </div>
    </div>
  );
}
