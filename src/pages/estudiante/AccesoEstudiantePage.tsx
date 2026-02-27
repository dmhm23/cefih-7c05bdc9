import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, GraduationCap } from 'lucide-react';
import { usePortalEstudianteSession } from '@/contexts/PortalEstudianteContext';
import { portalEstudianteService } from '@/services/portalEstudianteService';
import logoEmpresa from '@/assets/logo-empresa.png';

export default function AccesoEstudiantePage() {
  const navigate = useNavigate();
  const { setSession } = usePortalEstudianteSession();
  const [cedula, setCedula] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cedulaValida = /^\d{6,}$/.test(cedula);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedulaValida) return;

    setError(null);
    setLoading(true);

    try {
      const result = await portalEstudianteService.buscarMatriculaVigente(cedula);

      if (!result) {
        setError('No se encontró una matrícula vigente asociada a este número de documento.');
        return;
      }

      setSession({
        matriculaId: result.matricula.id,
        personaId: result.persona.id,
        cedula: result.persona.numeroDocumento,
        nombreEstudiante: `${result.persona.nombres} ${result.persona.apellidos}`,
        cursoNombre: result.curso.nombre,
        cursoFechaInicio: result.curso.fechaInicio,
        cursoFechaFin: result.curso.fechaFin,
      });

      navigate('/estudiante/inicio');
    } catch {
      setError('Ocurrió un error al buscar la matrícula. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo y título */}
        <div className="text-center space-y-3">
          <img
            src={logoEmpresa}
            alt="Logo SAFA"
            className="h-16 mx-auto object-contain"
          />
          <div className="flex items-center justify-center gap-2 text-primary">
            <GraduationCap className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Portal del Estudiante</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Ingresa tu número de cédula para acceder
          </p>
        </div>

        {/* Formulario */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cedula">Número de documento</Label>
                <Input
                  id="cedula"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej: 1234567890"
                  value={cedula}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setCedula(val);
                    setError(null);
                  }}
                  maxLength={15}
                  disabled={loading}
                  className="text-base h-12"
                  autoFocus
                />
                {cedula.length > 0 && !cedulaValida && (
                  <p className="text-xs text-destructive">
                    Ingresa al menos 6 dígitos
                  </p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={!cedulaValida || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  'Continuar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
