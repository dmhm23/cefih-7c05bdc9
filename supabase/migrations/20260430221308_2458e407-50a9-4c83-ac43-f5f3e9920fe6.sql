
-- Backup de documentos individuales que serán modificados por el backfill
CREATE TABLE IF NOT EXISTS _backup_documentos_consolidado_20260430 AS
SELECT d.id, d.matricula_id, d.tipo, d.nombre, d.estado, d.storage_path, d.archivo_nombre, d.fecha_carga, now() as backup_at
FROM documentos_matricula d
WHERE d.estado = 'pendiente'
  AND d.storage_path IS NULL
  AND d.tipo != 'consolidado'
  AND d.matricula_id IN (
    SELECT matricula_id FROM documentos_matricula WHERE tipo = 'consolidado' AND estado = 'cargado'
  )
  AND d.tipo::text IN (
    SELECT trim(unnest(string_to_array(
      replace(replace(c.nombre, 'Consolidado: ', ''), 'Consolidado:', ''), '|'
    )))
    FROM documentos_matricula c
    WHERE c.tipo = 'consolidado' AND c.estado = 'cargado' AND c.matricula_id = d.matricula_id
  );

-- RLS
ALTER TABLE _backup_documentos_consolidado_20260430 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo admin lee backup consolidados"
ON _backup_documentos_consolidado_20260430
FOR SELECT
TO authenticated
USING (get_my_rol() IN ('superadministrador', 'administrador'));
