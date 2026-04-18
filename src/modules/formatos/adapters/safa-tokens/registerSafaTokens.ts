/**
 * Adapter SAFA: registra resolvers de token sobre el TokenResolverPort.
 *
 * Reutiliza el switch existente en `@/modules/formatos/plugins/safa` para no duplicar
 * lógica de negocio. Cuando esté estable, cada namespace puede extraerse
 * a su propio resolver puro.
 */
import type { TokenResolverPort, TokenContext } from '../../contracts/TokenResolverPort';
import {
  resolveAutoFieldValue,
  type AutoFieldContext,
} from '../../plugins/safa/autoFields/resolveAutoField';
import type { AutoFieldKey } from '../../plugins/safa/types';

const SAFA_NAMESPACES = [
  // Aprendiz
  'nombre_aprendiz', 'documento_aprendiz', 'tipo_documento_aprendiz', 'genero_aprendiz',
  'fecha_nacimiento_aprendiz', 'pais_nacimiento_aprendiz', 'nivel_educativo_aprendiz',
  'rh_aprendiz', 'telefono_aprendiz', 'email_aprendiz',
  'contacto_emergencia_nombre', 'contacto_emergencia_telefono',
  // Salud
  'consentimiento_salud', 'restriccion_medica', 'restriccion_medica_detalle',
  'alergias', 'alergias_detalle', 'consumo_medicamentos', 'consumo_medicamentos_detalle', 'embarazo',
  // Laboral
  'empresa_nombre', 'empresa_cargo', 'empresa_nit', 'empresa_representante_legal',
  'area_trabajo', 'sector_economico', 'tipo_vinculacion', 'eps_aprendiz', 'arl_aprendiz',
  'nivel_previo', 'centro_formacion_previo', 'nivel_formacion', 'empresa_nivel_formacion',
  // Curso
  'nombre_curso', 'tipo_formacion_curso', 'numero_curso', 'fecha_inicio_curso',
  'fecha_fin_curso', 'duracion_dias_curso', 'horas_totales_curso',
  // Personal
  'entrenador_nombre', 'supervisor_nombre',
  // Sistema / firmas
  'fecha_diligenciamiento', 'aprendiz_firma', 'entrenador_firma', 'supervisor_firma',
];

export function registerSafaTokens(registry: TokenResolverPort) {
  // Resolver legacy: cada flat-key registrada apunta al mismo helper
  const safaResolver = (token: string, ctx: TokenContext) => {
    const safaCtx = ctx as unknown as AutoFieldContext;
    return resolveAutoFieldValue(token as AutoFieldKey, safaCtx);
  };
  for (const ns of SAFA_NAMESPACES) {
    registry.register(ns, safaResolver);
  }
  // Dynamic prefixes
  registry.register('formato_prev', safaResolver);
  registry.register('nivel_campo', safaResolver);
  // Fallback general
  registry.register('_legacy', safaResolver);
}
