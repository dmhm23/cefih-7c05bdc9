/**
 * Punto de entrada del plugin SAFA.
 *
 * Re-exporta todo lo que el host (la app) consume del dominio SAFA:
 *  - tipos (bloques, FormatoFormacion, FirmaMatricula, ...)
 *  - catálogos (auto-fields, tokens)
 *  - constantes UI del editor (etiquetas, iconos, paleta)
 *  - servicios (respuestas)
 *  - registrador de bloques
 *  - render de plantillas con tokens
 */
export * from './registerSafaPlugins';
export * from './types';
export * from './blockUI';
export * from './autoFields/catalog';
export * from './autoFields/tokenSources';
export * from './autoFields/resolveAutoField';
export * from './respuestas/respuestaService';
export * from './renderTemplate';
