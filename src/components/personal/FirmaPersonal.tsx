import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PenTool, RotateCcw, Save, CheckCircle2, Upload, Trash2, ImageIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FirmaPersonalProps {
  firmaExistente?: string;
  onGuardarFirma: (firmaBase64: string) => void;
  onEliminarFirma?: () => void;
  isPending?: boolean;
}

export function FirmaPersonal({ firmaExistente, onGuardarFirma, onEliminarFirma, isPending }: FirmaPersonalProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [tab, setTab] = useState<string>("dibujar");

  const handleClear = () => {
    sigRef.current?.clear();
    setIsEmpty(true);
  };

  const handleSaveDrawn = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const base64 = sigRef.current.getCanvas().toDataURL("image/png");
      onGuardarFirma(base64);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onGuardarFirma(result);
    };
    reader.readAsDataURL(file);
  };

  if (firmaExistente) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">Firma registrada</span>
          </div>
          {onEliminarFirma && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive h-7 px-2"
              onClick={onEliminarFirma}
              disabled={isPending}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Eliminar
            </Button>
          )}
        </div>
        <div className="border rounded-lg p-3 bg-background">
          <img src={firmaExistente} alt="Firma registrada" className="max-h-24 mx-auto" />
        </div>
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
            Cargar PNG
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dibujar" className="space-y-2 mt-2">
          <div className="border-2 border-dashed rounded-lg bg-background cursor-crosshair">
            <SignatureCanvas
              ref={sigRef}
              canvasProps={{
                className: "w-full",
                style: { width: "100%", height: "120px" },
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
            <Button type="button" size="sm" onClick={handleSaveDrawn} disabled={isEmpty || isPending}>
              <Save className="h-3.5 w-3.5 mr-1" />
              {isPending ? "Guardando..." : "Guardar Firma"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="cargar" className="space-y-2 mt-2">
          <p className="text-xs text-muted-foreground">
            Suba una imagen PNG con fondo transparente para mejores resultados.
          </p>
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileUpload}
            />
            <Button type="button" variant="outline" size="sm" className="w-full" asChild disabled={isPending}>
              <span>
                <Upload className="h-3.5 w-3.5 mr-1" />
                {isPending ? "Guardando..." : "Seleccionar imagen"}
              </span>
            </Button>
          </label>
        </TabsContent>
      </Tabs>
    </div>
  );
}
