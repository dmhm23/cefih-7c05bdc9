import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { PenTool, RotateCcw } from "lucide-react";

interface FirmaCapturaProps {
  onGuardar: (firmaBase64: string) => void;
  disabled?: boolean;
}

export function FirmaCaptura({ onGuardar, disabled }: FirmaCapturaProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleEnd = () => {
    if (sigRef.current && !isEmpty) {
      const base64 = sigRef.current.getCanvas().toDataURL("image/png");
      onGuardar(base64);
    }
  };

  const handleClear = () => {
    sigRef.current?.clear();
    setIsEmpty(true);
    onGuardar("");
  };

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
          onEnd={handleEnd}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleClear} disabled={isEmpty || disabled}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Limpiar
        </Button>
        {!isEmpty && (
          <span className="text-xs text-emerald-600 font-medium">✓ Firma lista</span>
        )}
      </div>
    </div>
  );
}
