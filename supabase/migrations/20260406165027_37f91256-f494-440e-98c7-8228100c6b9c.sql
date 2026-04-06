
-- Add missing ARL values
ALTER TYPE arl_enum ADD VALUE IF NOT EXISTS 'sura_arl';
ALTER TYPE arl_enum ADD VALUE IF NOT EXISTS 'suramericana';
ALTER TYPE arl_enum ADD VALUE IF NOT EXISTS 'otra_arl';

-- Add missing sector_economico values
ALTER TYPE sector_economico ADD VALUE IF NOT EXISTS 'infraestructura_vial';
ALTER TYPE sector_economico ADD VALUE IF NOT EXISTS 'energia_electrica';
ALTER TYPE sector_economico ADD VALUE IF NOT EXISTS 'petroleo_gas_mineria';
ALTER TYPE sector_economico ADD VALUE IF NOT EXISTS 'industria_manufacturera';
ALTER TYPE sector_economico ADD VALUE IF NOT EXISTS 'mantenimiento_industrial';
ALTER TYPE sector_economico ADD VALUE IF NOT EXISTS 'servicios_publicos';
ALTER TYPE sector_economico ADD VALUE IF NOT EXISTS 'logistica_almacenamiento';
ALTER TYPE sector_economico ADD VALUE IF NOT EXISTS 'limpieza_aseo';
ALTER TYPE sector_economico ADD VALUE IF NOT EXISTS 'publicidad_exterior';
ALTER TYPE sector_economico ADD VALUE IF NOT EXISTS 'agricultura_tecnificada';
ALTER TYPE sector_economico ADD VALUE IF NOT EXISTS 'sector_forestal';
ALTER TYPE sector_economico ADD VALUE IF NOT EXISTS 'aeronautica';
ALTER TYPE sector_economico ADD VALUE IF NOT EXISTS 'naval_portuario';
ALTER TYPE sector_economico ADD VALUE IF NOT EXISTS 'eventos_espectaculos';
ALTER TYPE sector_economico ADD VALUE IF NOT EXISTS 'educacion_formacion';
ALTER TYPE sector_economico ADD VALUE IF NOT EXISTS 'salud_investigacion';
ALTER TYPE sector_economico ADD VALUE IF NOT EXISTS 'bienes_raices';
ALTER TYPE sector_economico ADD VALUE IF NOT EXISTS 'energias_renovables';
ALTER TYPE sector_economico ADD VALUE IF NOT EXISTS 'otro_sector';
