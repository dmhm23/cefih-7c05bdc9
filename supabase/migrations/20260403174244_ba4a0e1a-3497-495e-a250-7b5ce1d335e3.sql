
-- ============================================================
-- PASO 1: Corregir ENUMs existentes + crear faltantes
-- ============================================================

-- 1a. Recrear estado_factura (no hay tablas usándolo)
DROP TYPE IF EXISTS public.estado_factura;
CREATE TYPE public.estado_factura AS ENUM ('por_pagar', 'parcial', 'pagada');

-- 1b. Recrear estado_grupo_cartera
DROP TYPE IF EXISTS public.estado_grupo_cartera;
CREATE TYPE public.estado_grupo_cartera AS ENUM ('sin_facturar', 'facturado', 'abonado', 'pagado', 'vencido');

-- 1c. Recrear tipo_actividad_cartera
DROP TYPE IF EXISTS public.tipo_actividad_cartera;
CREATE TYPE public.tipo_actividad_cartera AS ENUM ('llamada', 'promesa_pago', 'comentario', 'sistema');

-- 2a. Crear tipo_responsable
CREATE TYPE public.tipo_responsable AS ENUM ('empresa', 'independiente', 'arl');

-- 2b. Crear tipo_doc_portal
CREATE TYPE public.tipo_doc_portal AS ENUM ('firma_autorizacion', 'evaluacion', 'formulario', 'solo_lectura');

-- 2c. Crear estado_doc_portal
CREATE TYPE public.estado_doc_portal AS ENUM ('bloqueado', 'pendiente', 'completado');

-- 3. Ampliar tipo_entidad_audit con nuevos valores
ALTER TYPE public.tipo_entidad_audit ADD VALUE IF NOT EXISTS 'plantilla_certificado';
ALTER TYPE public.tipo_entidad_audit ADD VALUE IF NOT EXISTS 'excepcion_certificado';
ALTER TYPE public.tipo_entidad_audit ADD VALUE IF NOT EXISTS 'responsable_pago';
ALTER TYPE public.tipo_entidad_audit ADD VALUE IF NOT EXISTS 'actividad_cartera';
