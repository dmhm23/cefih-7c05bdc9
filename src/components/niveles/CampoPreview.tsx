import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CampoAdicional } from "@/types/nivelFormacion";

interface CampoPreviewProps {
  campo: CampoAdicional;
}

export function CampoPreview({ campo }: CampoPreviewProps) {
  const [textValue, setTextValue] = useState("");
  const [boolValue, setBoolValue] = useState(false);
  const [selectedMultiple, setSelectedMultiple] = useState<string[]>([]);
  const [selectValue, setSelectValue] = useState("");

  const toggleMultiple = (op: string) => {
    setSelectedMultiple((prev) =>
      prev.includes(op) ? prev.filter((v) => v !== op) : [...prev, op]
    );
  };

  const renderControl = () => {
    switch (campo.tipo) {
      case "texto_corto":
        return <Input placeholder={campo.nombre} value={textValue} onChange={(e) => setTextValue(e.target.value)} />;
      case "url":
        return <Input type="url" placeholder="https://ejemplo.com" value={textValue} onChange={(e) => setTextValue(e.target.value)} />;
      case "email":
        return <Input type="email" placeholder="correo@ejemplo.com" value={textValue} onChange={(e) => setTextValue(e.target.value)} />;
      case "telefono":
        return <Input type="tel" placeholder="+57 300 000 0000" value={textValue} onChange={(e) => setTextValue(e.target.value)} />;
      case "texto_largo":
        return <Textarea placeholder={campo.nombre} rows={2} value={textValue} onChange={(e) => setTextValue(e.target.value)} />;
      case "numerico":
        return <Input type="number" placeholder="0" value={textValue} onChange={(e) => setTextValue(e.target.value)} />;
      case "select":
        return (
          <Select value={selectValue} onValueChange={setSelectValue}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {(campo.opciones || []).map((op) => (
                <SelectItem key={op} value={op}>{op}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "select_multiple":
        return (
          <div className="flex flex-wrap gap-2">
            {(campo.opciones || []).length > 0 ? (
              campo.opciones!.map((op) => (
                <div key={op} className="flex items-center gap-1.5">
                  <Checkbox
                    checked={selectedMultiple.includes(op)}
                    onCheckedChange={() => toggleMultiple(op)}
                  />
                  <Label className="text-sm">{op}</Label>
                </div>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">Sin opciones configuradas</span>
            )}
          </div>
        );
      case "estado":
        return (
          <div className="flex items-center gap-2">
            <Switch checked={boolValue} onCheckedChange={setBoolValue} />
            <Label className="text-sm">{boolValue ? "Activo" : "Inactivo"}</Label>
          </div>
        );
      case "booleano":
        return (
          <div className="flex items-center gap-2">
            <Switch checked={boolValue} onCheckedChange={setBoolValue} />
            <Label className="text-sm">{boolValue ? "Sí" : "No"}</Label>
          </div>
        );
      case "fecha":
        return <Input type="date" value={textValue} onChange={(e) => setTextValue(e.target.value)} />;
      case "fecha_hora":
        return <Input type="datetime-local" value={textValue} onChange={(e) => setTextValue(e.target.value)} />;
      case "archivo":
        return <Input type="file" />;
      default:
        return <Input placeholder={campo.nombre} value={textValue} onChange={(e) => setTextValue(e.target.value)} />;
    }
  };

  return (
    <div className="mt-2">
      {renderControl()}
    </div>
  );
}
