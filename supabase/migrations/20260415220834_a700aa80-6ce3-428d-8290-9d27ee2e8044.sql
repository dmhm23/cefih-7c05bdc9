
-- Limpiar duplicados existentes (conservar el más antiguo por matricula_id + tipo)
DELETE FROM documentos_matricula
WHERE id NOT IN (
  SELECT DISTINCT ON (matricula_id, tipo) id
  FROM documentos_matricula
  ORDER BY matricula_id, tipo, created_at ASC
);

-- Prevenir duplicados futuros
ALTER TABLE documentos_matricula
  ADD CONSTRAINT uq_documentos_matricula_tipo
  UNIQUE (matricula_id, tipo);
