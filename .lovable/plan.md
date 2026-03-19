

## Plan: Generar documento de reglas de negocio (REGLAS_NEGOCIO.md)

Tarea de generación de artefacto (no requiere cambios en el código). Se creará un archivo `.md` exhaustivo en `/mnt/documents/` basado en el análisis completo del código fuente.

### Contenido del documento

El archivo se organizará por módulo con reglas numeradas:

1. **Personas** — unicidad de documento, auditoría
2. **Niveles de Formación** — documentos requeridos dinámicos, campos adicionales, código estudiante
3. **Cursos** — ciclo de vida (abierto→en_progreso→cerrado), validaciones de cierre, capacidad máxima, MinTrabajo, eliminación
4. **Matrículas** — creación, duplicados, estados, documentos dinámicos, firma, pago, portal auto-init, cartera auto-asignación
5. **Formatos de Formación** — asignación por tipo/nivel, bloques, evaluación (umbral 70%), firmas, estado legacy
6. **Cartera** — agrupación automática por responsable, recálculo de estados, facturas, pagos, sincronización bidireccional con matrículas
7. **Certificación** — elegibilidad (pago + documentos), excepciones, plantillas SVG con tokens, versionado, revocación, reemisión
8. **Portal Estudiante** — acceso por cédula, dependencias entre documentos, evaluación con reintentos, monitoreo admin
9. **Personal y Cargos** — unicidad nombre cargo, eliminación protegida, firma centralizada
10. **Auditoría** — registro transversal de acciones

**Sección final: Inconsistencias** — reglas faltantes, conflictos entre modelos, casos no cubiertos.

### Ejecución

- Script que escribe el archivo markdown a `/mnt/documents/REGLAS_NEGOCIO.md`
- Se presentará como artifact descargable

