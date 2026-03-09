import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Settings2 } from "lucide-react";
import { CampoAdicional } from "@/types/nivelFormacion";
import { UseFormReturn } from "react-hook-form";

interface Props {
  campos: CampoAdicional[];
  form: UseFormReturn<any>;
}

export function CamposAdicionalesCard({ campos, form }: Props) {
  if (campos.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Campos Adicionales
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {campos.map((campo) => (
          <DynamicField key={campo.id} campo={campo} form={form} />
        ))}
      </CardContent>
    </Card>
  );
}

function DynamicField({ campo, form }: { campo: CampoAdicional; form: UseFormReturn<any> }) {
  const fieldName = `_ca_${campo.id}`;
  const label = `${campo.nombre}${campo.obligatorio ? " *" : ""}`;

  switch (campo.tipo) {
    case "texto_corto":
      return (
        <FormField control={form.control} name={fieldName} render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl><Input type="text" {...field} value={field.value ?? ""} placeholder={campo.nombre} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      );

    case "texto_largo":
      return (
        <FormField control={form.control} name={fieldName} render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl><Textarea {...field} value={field.value ?? ""} placeholder={campo.nombre} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      );

    case "numerico":
      return (
        <FormField control={form.control} name={fieldName} render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl><Input type="number" {...field} value={field.value ?? ""} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      );

    case "select":
      return (
        <FormField control={form.control} name={fieldName} render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {(campo.opciones || []).map((op) => (
                  <SelectItem key={op} value={op}>{op}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
      );

    case "select_multiple":
      return (
        <FormField control={form.control} name={fieldName} render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="space-y-2 pt-1">
              {(campo.opciones || []).map((op) => {
                const values: string[] = field.value || [];
                return (
                  <div key={op} className="flex items-center gap-2">
                    <Checkbox
                      checked={values.includes(op)}
                      onCheckedChange={(checked) => {
                        const next = checked
                          ? [...values, op]
                          : values.filter((v: string) => v !== op);
                        field.onChange(next);
                      }}
                    />
                    <Label className="font-normal">{op}</Label>
                  </div>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )} />
      );

    case "estado":
      return (
        <FormField control={form.control} name={fieldName} render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between py-2 px-3 rounded-md border">
              <FormLabel>{label}</FormLabel>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {field.value === "activo" ? "Activo" : "Inactivo"}
                </span>
                <Switch
                  checked={field.value === "activo"}
                  onCheckedChange={(c) => field.onChange(c ? "activo" : "inactivo")}
                />
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )} />
      );

    case "fecha":
      return (
        <FormField control={form.control} name={fieldName} render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      );

    case "fecha_hora":
      return (
        <FormField control={form.control} name={fieldName} render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl><Input type="datetime-local" {...field} value={field.value ?? ""} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      );

    case "booleano":
      return (
        <FormField control={form.control} name={fieldName} render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between py-2 px-3 rounded-md border">
              <FormLabel>{label}</FormLabel>
              <Switch checked={!!field.value} onCheckedChange={field.onChange} />
            </div>
            <FormMessage />
          </FormItem>
        )} />
      );

    case "archivo":
      return (
        <FormField control={form.control} name={fieldName} render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <FileDropZone
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onFile={(file) => field.onChange(file.name)}
                compact
                label="Seleccionar archivo"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      );

    case "url":
      return (
        <FormField control={form.control} name={fieldName} render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl><Input type="url" {...field} value={field.value ?? ""} placeholder="https://..." /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      );

    case "telefono":
      return (
        <FormField control={form.control} name={fieldName} render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl><Input type="tel" {...field} value={field.value ?? ""} placeholder="+57 300 000 0000" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      );

    case "email":
      return (
        <FormField control={form.control} name={fieldName} render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl><Input type="email" {...field} value={field.value ?? ""} placeholder="correo@ejemplo.com" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      );

    default:
      return null;
  }
}
