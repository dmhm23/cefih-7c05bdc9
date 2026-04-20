-- Normaliza consolidados existentes: por cada grupo (matricula_id, storage_path) con
-- 2+ filas que comparten el mismo PDF, crea una sola fila tipo='consolidado' que
-- agrupa los tipos cubiertos en `nombre`, y resetea las filas individuales a
-- 'pendiente' (limpia storage_path / archivo_nombre / archivo_tamano / fecha_carga).
DO $$
DECLARE
  _grp RECORD;
  _consolidado_id UUID;
BEGIN
  FOR _grp IN
    SELECT
      matricula_id,
      storage_path,
      MIN(archivo_nombre) AS archivo_nombre,
      MIN(archivo_tamano) AS archivo_tamano,
      MIN(fecha_carga)    AS fecha_carga,
      array_agg(tipo::text ORDER BY tipo::text) AS tipos,
      array_agg(id) AS ids
    FROM public.documentos_matricula
    WHERE estado = 'cargado'
      AND storage_path IS NOT NULL
      AND tipo <> 'consolidado'
    GROUP BY matricula_id, storage_path
    HAVING count(*) >= 2
  LOOP
    -- Verificar si ya existe un consolidado con ese mismo storage_path
    SELECT id INTO _consolidado_id
    FROM public.documentos_matricula
    WHERE matricula_id = _grp.matricula_id
      AND tipo = 'consolidado'
      AND storage_path = _grp.storage_path
    LIMIT 1;

    IF _consolidado_id IS NULL THEN
      INSERT INTO public.documentos_matricula
        (matricula_id, tipo, nombre, estado, storage_path, archivo_nombre, archivo_tamano, fecha_carga, opcional)
      VALUES
        (_grp.matricula_id,
         'consolidado',
         'Consolidado: ' || array_to_string(_grp.tipos, '|'),
         'cargado',
         _grp.storage_path,
         _grp.archivo_nombre,
         _grp.archivo_tamano,
         _grp.fecha_carga,
         FALSE);
    END IF;

    -- Resetear las filas individuales del grupo
    UPDATE public.documentos_matricula
    SET estado = 'pendiente',
        storage_path = NULL,
        archivo_nombre = NULL,
        archivo_tamano = NULL,
        fecha_carga = NULL
    WHERE id = ANY(_grp.ids);
  END LOOP;
END $$;