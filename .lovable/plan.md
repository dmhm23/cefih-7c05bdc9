

## Fix: Ajustar mock data para que el portal sea testeable

### Problema
Hoy es 2026-02-27. Todos los cursos con matrículas ya vencieron o están cerrados. Ninguna cédula de prueba resuelve matrícula vigente.

### Solución
Modificar `src/data/mockData.ts`:

1. **Curso c1**: Mover fechas a rango actual vigente
   - `fechaInicio`: `2026-02-24`
   - `fechaFin`: `2026-03-05`
   - Estado se mantiene `en_progreso`

2. **Curso c2**: Mover fechas a rango actual vigente
   - `fechaInicio`: `2026-02-26`
   - `fechaFin`: `2026-03-04`
   - Estado se mantiene `en_progreso`

Esto habilita las siguientes cédulas de prueba:

| Cédula | Persona | Curso |
|---|---|---|
| `1234567890` | Juan Carlos Rodriguez | Trabajador Autorizado TA-2026-001 |
| `0987654321` | Ana Maria Garcia | Trabajador Autorizado TA-2026-001 |
| `5678901234` | Pedro Martinez | Reentrenamiento RE-2026-002 |

### Archivo modificado
- `src/data/mockData.ts` — Solo se cambian las fechas de los cursos c1 y c2 (4 líneas).

