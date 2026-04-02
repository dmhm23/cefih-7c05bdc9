import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText, Briefcase, HeartPulse, ShieldCheck, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IconButton } from "@/components/shared/IconButton";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { usePortalEstudianteSession } from '@/contexts/PortalEstudianteContext';
import { useInfoAprendizData, useDocumentosPortal, useEnviarDocumento } from '@/hooks/usePortalEstudiante';
import { ConsentimientoSalud } from '@/components/matriculas/ConsentimientoSalud';
import { FirmaCaptura } from '@/components/matriculas/FirmaCaptura';
import {
  TIPOS_DOCUMENTO, GENEROS, NIVELES_EDUCATIVOS, AREAS_TRABAJO,
  SECTORES_ECONOMICOS, PAISES, EPS_OPTIONS, ARL_OPTIONS,
  TIPOS_VINCULACION,
} from '@/data/formOptions';

function resolveLabel(options: readonly { value: string; label: string }[], value?: string): string {
  if (!value) return '—';
  return options.find(o => o.value === value)?.label || value;
}

function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || '—'}</p>
    </div>
  );
}

export default function InfoAprendizPage() {
  const navigate = useNavigate();
  const { session } = usePortalEstudianteSession();
  const { toast } = useToast();

  const matriculaId = session?.matriculaId || null;
  const { data, isLoading } = useInfoAprendizData(matriculaId);
  const { data: docData } = useDocumentosPortal(matriculaId);
  const enviarMutation = useEnviarDocumento();

  const [autorizacion, setAutorizacion] = useState<'acepto' | 'no_acepto' | null>(null);
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null);
  const [consentimientoData, setConsentimientoData] = useState<Record<string, unknown> | null>(null);

  const handleFirmaChange = (base64: string) => {
    setFirmaBase64(base64 || null);
    if (base64) {
      setAutorizacion('acepto');
    }
  };

  const docEstado = docData?.estados.find(d => d.key === 'info_aprendiz');
  const yaCompletado = docEstado?.estado === 'completado';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando información...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-destructive">No se pudo cargar la información.</p>
      </div>
    );
  }

  const { persona, matricula } = data;

  // Initialize consentimiento from matricula data (only once)
  if (!consentimientoData && data) {
    setConsentimientoData({
      consentimientoSalud: matricula.consentimientoSalud,
      restriccionMedica: matricula.restriccionMedica,
      restriccionMedicaDetalle: matricula.restriccionMedicaDetalle,
      alergias: matricula.alergias,
      alergiasDetalle: matricula.alergiasDetalle,
      consumoMedicamentos: matricula.consumoMedicamentos,
      consumoMedicamentosDetalle: matricula.consumoMedicamentosDetalle,
      embarazo: matricula.embarazo,
      nivelLectoescritura: matricula.nivelLectoescritura,
    });
  }

  const consentimiento = consentimientoData || {
    consentimientoSalud: false,
    restriccionMedica: false,
    alergias: false,
    consumoMedicamentos: false,
    nivelLectoescritura: false,
  };

  const handleConsentimientoChange = (field: string, value: unknown) => {
    setConsentimientoData(prev => ({ ...prev, [field]: value }));
  };

  const puedeEnviar = autorizacion === 'acepto' && !!firmaBase64 && !enviarMutation.isPending;

  const handleEnviar = () => {
    if (!matriculaId || !firmaBase64) return;

    enviarMutation.mutate(
      {
        matriculaId,
        documentoKey: 'info_aprendiz',
        payload: {
          firmaBase64,
          firmaFecha: new Date().toISOString(),
          metadata: { autorizacionAceptada: true, consentimientoSalud: consentimientoData },
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'Documento enviado', description: 'Información del Aprendiz completada exitosamente.' });
          navigate('/estudiante/inicio');
        },
        onError: () => {
          toast({ title: 'Error', description: 'No se pudo enviar el documento.', variant: 'destructive' });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-md px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <IconButton tooltip="Volver" className="shrink-0" onClick={() => navigate('/estudiante/inicio')}>
          <ArrowLeft className="h-4 w-4" />
        </IconButton>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Información del Aprendiz</h1>
            <p className="text-xs text-muted-foreground">Revise sus datos y firme al final</p>
          </div>
          {yaCompletado && (
            <Badge className="shrink-0 bg-success text-success-foreground hover:bg-success/90">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Completado
            </Badge>
          )}
        </div>

        {/* Completed state */}
        {yaCompletado && docEstado && (
          <Card className="p-4 border-primary/20 bg-primary/5 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm font-medium">Documento enviado exitosamente</p>
            </div>
            {docEstado.enviadoEn && (
              <p className="text-xs text-muted-foreground">
                Enviado el {new Date(docEstado.enviadoEn).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            {docEstado.firmaBase64 && (
              <div className="border rounded-lg p-2 bg-background">
                <p className="text-xs text-muted-foreground mb-1">Firma registrada:</p>
                <img src={docEstado.firmaBase64} alt="Firma" className="max-h-20 mx-auto" />
              </div>
            )}
            <Button className="w-full" onClick={() => navigate('/estudiante/inicio')}>
              Volver al inicio
            </Button>
          </Card>
        )}

        {/* Accordions - always visible */}
        <Accordion type="multiple" defaultValue={yaCompletado ? [] : ['datos-personales']} className="space-y-2">
          {/* Datos Personales */}
          <AccordionItem value="datos-personales" className="border rounded-lg px-3 bg-card">
            <AccordionTrigger className="hover:no-underline gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Datos Personales</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-3 pb-2">
                <ReadOnlyField label="Nombres" value={persona.nombres} />
                <ReadOnlyField label="Apellidos" value={persona.apellidos} />
                <ReadOnlyField label="Tipo documento" value={resolveLabel(TIPOS_DOCUMENTO, persona.tipoDocumento)} />
                <ReadOnlyField label="Número documento" value={persona.numeroDocumento} />
                <ReadOnlyField label="Género" value={resolveLabel(GENEROS, persona.genero)} />
                <ReadOnlyField label="Fecha nacimiento" value={persona.fechaNacimiento} />
                <ReadOnlyField label="RH" value={persona.rh} />
                <ReadOnlyField label="Nivel educativo" value={resolveLabel(NIVELES_EDUCATIVOS, persona.nivelEducativo)} />
                <ReadOnlyField label="País nacimiento" value={resolveLabel(PAISES, persona.paisNacimiento)} />
                <ReadOnlyField label="Email" value={persona.email} />
                <ReadOnlyField label="Teléfono" value={persona.telefono} />
              </div>
              <Separator className="my-2" />
              <p className="text-xs font-medium text-muted-foreground mb-2">Contacto de emergencia</p>
              <div className="grid grid-cols-2 gap-3">
                <ReadOnlyField label="Nombre" value={persona.contactoEmergencia.nombre} />
                <ReadOnlyField label="Teléfono" value={persona.contactoEmergencia.telefono} />
                <ReadOnlyField label="Parentesco" value={persona.contactoEmergencia.parentesco} />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Vinculación Laboral */}
          <AccordionItem value="vinculacion" className="border rounded-lg px-3 bg-card">
            <AccordionTrigger className="hover:no-underline gap-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Vinculación Laboral</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-3 pb-2">
                <ReadOnlyField label="Tipo vinculación" value={resolveLabel(TIPOS_VINCULACION, matricula.tipoVinculacion)} />
                {matricula.tipoVinculacion === 'empresa' && (
                  <>
                    <ReadOnlyField label="Empresa" value={matricula.empresaNombre} />
                    <ReadOnlyField label="NIT" value={matricula.empresaNit} />
                    <ReadOnlyField label="Representante legal" value={matricula.empresaRepresentanteLegal} />
                    <ReadOnlyField label="Cargo" value={matricula.empresaCargo} />
                  </>
                )}
                <ReadOnlyField label="Área de trabajo" value={resolveLabel(AREAS_TRABAJO, matricula.areaTrabajo)} />
                <ReadOnlyField label="Sector económico" value={resolveLabel(SECTORES_ECONOMICOS, matricula.sectorEconomico)} />
                <ReadOnlyField label="EPS" value={resolveLabel(EPS_OPTIONS, matricula.eps)} />
                {matricula.epsOtra && <ReadOnlyField label="EPS (otra)" value={matricula.epsOtra} />}
                <ReadOnlyField label="ARL" value={resolveLabel(ARL_OPTIONS, matricula.arl)} />
                {matricula.arlOtra && <ReadOnlyField label="ARL (otra)" value={matricula.arlOtra} />}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Consentimiento de Salud */}
          <AccordionItem value="salud" className="border rounded-lg px-3 bg-card">
            <AccordionTrigger className="hover:no-underline gap-2">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Consentimiento de Salud</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ConsentimientoSalud
                data={consentimiento as any}
                onChange={handleConsentimientoChange}
                genero={persona.genero}
                readOnly={yaCompletado}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Interactive sections - only if not completed */}
        {!yaCompletado && (
          <div className="space-y-4">
            {/* Autorización */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Autorización de datos</h3>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Autorizo de manera voluntaria, previa, explícita e informada el tratamiento de mis datos personales
                conforme a la política de protección de datos.
              </p>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                    Leer texto completo de autorización →
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Autorización de tratamiento de datos personales</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
                    <p>
                      En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, autorizo de manera voluntaria,
                      previa, explícita e informada al centro de formación para el trabajo y desarrollo humano, para que
                      realice la recolección, almacenamiento, uso, circulación, supresión y en general, el tratamiento de
                      mis datos personales.
                    </p>
                    <p>
                      Los datos personales suministrados serán utilizados para las siguientes finalidades:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Gestionar el proceso de formación y certificación.</li>
                      <li>Reportar información ante el Ministerio del Trabajo según la normativa vigente.</li>
                      <li>Emitir certificados de aptitud y competencia.</li>
                      <li>Contactar al estudiante o su contacto de emergencia en caso de ser necesario.</li>
                      <li>Cumplir con obligaciones legales y regulatorias.</li>
                    </ul>
                    <p>
                      Declaro que he sido informado(a) sobre mis derechos como titular de datos personales, incluyendo
                      el derecho a conocer, actualizar, rectificar y solicitar la supresión de mis datos.
                    </p>
                  </div>
                </SheetContent>
              </Sheet>

              <RadioGroup
                value={autorizacion || ''}
                onValueChange={(v) => setAutorizacion(v as 'acepto' | 'no_acepto')}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="acepto" id="acepto" />
                  <Label htmlFor="acepto" className="text-sm cursor-pointer">Acepto</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no_acepto" id="no_acepto" />
                  <Label htmlFor="no_acepto" className="text-sm cursor-pointer">No acepto</Label>
                </div>
              </RadioGroup>

              {autorizacion === 'no_acepto' && (
                <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-xs text-destructive">
                    Sin la autorización de datos no es posible completar el proceso de matrícula.
                  </p>
                </div>
              )}
            </Card>

            {/* Firma */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <PenTool className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Firma del estudiante</h3>
              </div>
              <FirmaCaptura
                onGuardar={handleFirmaChange}
                disabled={autorizacion !== 'acepto'}
              />
            </Card>

            {/* Enviar */}
            <Button
              className="w-full h-12 text-base"
              disabled={!puedeEnviar}
              onClick={handleEnviar}
            >
              {enviarMutation.isPending ? 'Enviando...' : 'Enviar documento'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}