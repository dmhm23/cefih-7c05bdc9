
El usuario tiene 10.725 personas y la tabla tarda ~15 segundos en mostrar datos. Necesito investigar el flujo actual antes de proponer opciones.

Hipótesis iniciales:
1. `personaService.getAll()` usa `fetchAllPaginated` → trae las 10.725 filas en 11 requests de 1000 → red lenta.
2. React Query las cachea pero la primera carga es pesada.
3. El componente `DataTable` con lazy load ya renderiza solo 100 a la vez (ya está optimizado el render).
4. El cuello de botella probable: la transferencia de red (10.725 filas × ~30 columnas = payload grande).

Necesito ver:
- `src/pages/personas/PersonasPage.tsx` (cómo consume)
- `src/services/personaService.ts` (qué columnas trae, cómo pagina)
- columnas usadas en la tabla vs columnas pesadas (firma_storage_path, contacto_emergencia jsonb, observaciones)

Voy a leer esos archivos y consultar tamaño real del payload en BD.
