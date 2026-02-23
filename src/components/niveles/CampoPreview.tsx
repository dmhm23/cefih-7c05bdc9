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
  const renderControl = () => {
    switch (campo.tipo) {
      case "texto_corto":
        return <Input placeholder={campo.nombre} disabled />;
      case "url":
        return <Input type="url" placeholder="https://ejemplo.com" disabled />;
      case "email":
        return <Input type="email" placeholder="correo@ejemplo.com" disabled />;
      case "telefono":
        return <Input type="tel" placeholder="+57 300 000 0000" disabled />;
      case "texto_largo":
        return <Textarea placeholder={campo.nombre} rows={2} disabled />;
      case "numerico":
        return <Input type="number" placeholder="0" disabled />;
      case "select":
        return (
          <Select disabled>
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
                  <Checkbox disabled />
                  <Label className="text-sm text-muted-foreground">{op}</Label>
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
            <Switch disabled />
            <Label className="text-sm text-muted-foreground">Inactivo</Label>
          </div>
        );
      case "booleano":
        return (
          <div className="flex items-center gap-2">
            <Switch disabled />
            <Label className="text-sm text-muted-foreground">No</Label>
          </div>
        );
      case "fecha":
        return <Input type="date" disabled />;
      case "fecha_hora":
        return <Input type="datetime-local" disabled />;
      case "archivo":
        return <Input type="file" disabled />;
      default:
        return <Input placeholder={campo.nombre} disabled />;
    }
  };

  return (
    <div className="mt-2 pointer-events-none opacity-75">
      {renderControl()}
    </div>
  );
}
