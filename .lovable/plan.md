## Plan: Agregar 20 estudiantes mock con matrículas, cursos y datos de cartera

### Resumen

Agregar 20 nuevas personas (p5-p24) con datos realistas colombianos, sus matrículas correspondientes distribuidas en los cursos existentes (especialmente c1, c2, c5, c6 que tienen capacidad), y actualizar los grupos de cartera y cursos para reflejar las nuevas inscripciones. También añadirlos a las empresas ya existentes.

### Cambios

#### 1. `src/data/mockData.ts` — Agregar personas, matrículas y actualizar cursos

- **20 personas nuevas** (p5-p24) con nombres colombianos variados, diferentes tipos de documento, niveles educativos, sectores económicos, géneros, y contactos de emergencia.
- **20 matrículas nuevas** (m5-m24) distribuidas así:
  - **c1** (Trabajador Autorizado, cap. 20, en_progreso): +6 matrículas (quedaría 8/20)
  - **c2** (Reentrenamiento, cap. 25, en_progreso): +5 matrículas (quedaría 6/25)
  - **c5** (Jefe de Área, cap. 12, abierto): +4 matrículas (quedaría 4/12)
  - **c6** (Reentrenamiento, cap. 20, abierto): +5 matrículas (quedaría 5/20)
- Estados variados: creada, pendiente, completa — mezcla realista.
- Vinculaciones: ~12 empresa (repartidas entre empresas existentes + 2 nuevas) y ~8 independientes.
- Valores de cupo entre $250.000 y $500.000, algunos pagados, otros con abonos parciales o sin pago.
- Actualizar `matriculasIds` de cada curso afectado.

#### 2. `src/data/mockCartera.ts` — Agregar responsables, grupos, facturas y pagos

- **2 responsables nuevos** (rp5, rp6) para las nuevas empresas.
- **Grupos de cartera nuevos** para los nuevos responsables.
- Agregar matrículas de empresas existentes a sus grupos existentes (gc1, gc2, gc4) y actualizar totales.
- Grupos de independientes nuevos para los estudiantes independientes.
- **Facturas y pagos** para algunos grupos (no todos — simular cartera pendiente realista).

### Distribución de datos

```text
Empresa                      | Responsable | Matrículas
─────────────────────────────┼─────────────┼───────────
Constructora ABC (existente) | rp1/gc1     | +3 nuevas
Infra del Norte (existente)  | rp2/gc2     | +2 nuevas
Telecom Solutions (exist.)   | rp4/gc4     | +2 nuevas
Energía Solar del Caribe     | rp5/gc5     | 3 nuevas
Minera Andina S.A.S          | rp6/gc6     | 2 nuevas
Independientes               | rp7-rp14    | 8 nuevas
```

### Archivos a modificar

1. `src/data/mockData.ts` — personas, matrículas, actualizar `matriculasIds` de cursos
2. `src/data/mockCartera.ts` — responsables, grupos, facturas, pagos, actividades