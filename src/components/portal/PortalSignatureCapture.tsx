import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { PenTool, RotateCcw, Save, CheckCircle2, ImageIcon, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDropZone } from "@/components/shared/FileDropZone";
import type { FirmaMatricula } from "@/types/formatoFormacion";

interface PortalSignatureCaptureProps {
  blockId: string;
  label?: string;
  value: string | null;
  onChange: (base64: string | null) => void;
  readOnly?: boolean;
  reusableSignature?: FirmaMatricula | null;
  esOrigenFirma?: boolean;
  autorizaReutilizacion?: boolean;
  onAutorizaReutilizacionChange?: (v: boolean) => void;
}

export default function PortalSignatureCapture({
  label,
  value,
  onChange,
  readOnly,
  reusableSignature,
  esOrigenFirma,
  autorizaReutilizacion,
  onAutorizaReutilizacionChange,
}: PortalSignatureCaptureProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [tab, setTab] = useState<string>("dibujar");

  // If there's a reusable signature and no value yet, auto-fill
  const displayValue = value || (reusableSignature?.firmaBase64 ?? null);
  const isReused = !value && !!reusableSignature?.firmaBase64;

  const handleClear = () => {
    sigRef.current?.clear();
    setIsEmpty(true);
  };

  const handleSaveDrawn = () => {
    if (sigRef.current && !isEmpty) {
      const base64 = sigRef.current.getCanvas().toDataURL("image/png");
      onChange(base64);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    onChange(null);
    handleClear();
  };

  // Show existing/reused signature
  if (displayValue) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">
              {isReused ? "Firma reutilizada" : "Firma capturada"}
            </span>
          </div>
          {!readOnly && (
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={handleReset}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Cambiar firma
            </Button>
          )}
        </div>
        <div className="border rounded-lg p-3 bg-background">
          <img src={displayValue} alt="Firma" className="max-h-24 mx-auto" />
        </div>

        {esOrigenFirma && !readOnly && (
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={autorizaReutilizacion ?? false}
              onChange={(e) => onAutorizaReutilizacionChange?.(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-muted-foreground">
              Autorizo la reutilización de mi firma en los demás documentos de esta matrícula
            </span>
          </label>
        )}
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="text-sm text-muted-foreground italic py-2">
        Sin firma registrada
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="dibujar" className="text-xs gap-1">
            <PenTool className="h-3.5 w-3.5" />
            Dibujar
          </TabsTrigger>
          <TabsTrigger value="cargar" className="text-xs gap-1">
            <ImageIcon className="h-3.5 w-3.5" />
            Cargar imagen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dibujar" className="space-y-2 mt-2">
          <div className="border-2 border-dashed rounded-lg bg-background cursor-crosshair">
            <SignatureCanvas
              ref={sigRef}
              canvasProps={{
                className: "w-full",
                style: { width: "100%", height: "140px" },
              }}
              penColor="black"
              backgroundColor="white"
              onBegin={() => setIsEmpty(false)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleClear} disabled={isEmpty}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Limpiar
            </Button>
            <Button type="button" size="sm" onClick={handleSaveDrawn} disabled={isEmpty}>
              <Save className="h-3.5 w-3.5 mr-1" />
              Guardar Firma
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="cargar" className="space-y-2 mt-2">
          <FileDropZone
            accept="image/png,image/jpeg,image/webp"
            onFile={handleFileUpload}
            label="Arrastra una imagen aquí o haz clic para seleccionar"
            hint="PNG con fondo transparente para mejores resultados"
          />
        </TabsContent>
      </Tabs>

      {esOrigenFirma && (
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={autorizaReutilizacion ?? false}
            onChange={(e) => onAutorizaReutilizacionChange?.(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-muted-foreground">
            Autorizo la reutilización de mi firma en los demás documentos de esta matrícula
          </span>
        </label>
      )}
    </div>
  );
}
