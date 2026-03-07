import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, AlertTriangle } from "lucide-react";
import { useMatriculas } from "@/hooks/useMatriculas";
import { usePersonas } from "@/hooks/usePersonas";
import { useCursos } from "@/hooks/useCursos";
import { construirDiccionarioTokens, reemplazarTokens } from "@/utils/certificadoGenerator";

interface Props {
  svgContent: string;
}

export default function PlantillaTestDialog({ svgContent }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedMatriculaId, setSelectedMatriculaId] = useState<string>('');
  const { data: matriculas } = useMatriculas();
  const { data: personas } = usePersonas();
  const { data: cursos } = useCursos();

  const result = useMemo(() => {
    if (!selectedMatriculaId || !matriculas || !personas || !cursos) return null;
    const mat = matriculas.find(m => m.id === selectedMatriculaId);
    if (!mat) return null;
    const persona = personas.find(p => p.id === mat.personaId);
    const curso = cursos.find(c => c.id === mat.cursoId);
    if (!persona || !curso) return null;

    const dict = construirDiccionarioTokens(persona, curso, mat);
    dict.codigoCertificado = 'PREVIEW-001';
    const rendered = reemplazarTokens(svgContent, dict);
    const unresolvedMatches = rendered.match(/\{\{(\w+)\}\}/g);
    const unresolved = unresolvedMatches ? [...new Set(unresolvedMatches)] : [];
    return { rendered, unresolved };
  }, [selectedMatriculaId, matriculas, personas, cursos, svgContent]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" /> Probar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Probar plantilla con datos reales</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Select value={selectedMatriculaId} onValueChange={setSelectedMatriculaId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar matrícula..." />
            </SelectTrigger>
            <SelectContent>
              {(matriculas ?? []).map(m => {
                const persona = personas?.find(p => p.id === m.personaId);
                const curso = cursos?.find(c => c.id === m.cursoId);
                return (
                  <SelectItem key={m.id} value={m.id}>
                    {persona ? `${persona.nombres} ${persona.apellidos}` : m.personaId} — {curso?.numeroCurso || m.cursoId}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {result && (
            <>
              {result.unresolved.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Tokens sin resolver: {result.unresolved.map(t => (
                      <Badge key={t} variant="outline" className="ml-1 text-xs">{t}</Badge>
                    ))}
                  </AlertDescription>
                </Alert>
              )}
              <div className="border rounded-lg bg-muted/30 p-4 overflow-auto" dangerouslySetInnerHTML={{ __html: result.rendered }} />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
