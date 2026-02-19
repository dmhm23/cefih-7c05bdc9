

## Plan: Optimizar seccion de documentos en panel deslizante

### Problemas identificados

1. **Desbordamiento de margenes**: La fila de cada documento usa `flex items-center gap-3 p-2.5` con el nombre, badge de estado y boton de accion en linea. En paneles estrechos, estos elementos no tienen restriccion de ancho y se salen del contenedor.
2. **Superposicion de etiquetas de estado**: El Badge de estado y el boton "Cargar" / menu de acciones estan en la misma linea que el nombre del documento sin `flex-wrap`, causando que se superpongan cuando el nombre es largo.
3. **Nombre "ARL (Aseguradora de Riesgos Laborales)"**: Aparece en `mockData.ts` (datos de prueba) y en el tooltip de `DocumentosCarga.tsx`. El servicio `documentoService.ts` ya usa "ARL" corto, pero los datos mock existentes tienen el nombre largo.

### Cambios propuestos

#### 1. Renombrar ARL en datos mock (`src/data/mockData.ts`)
- Cambiar todas las ocurrencias de `'ARL (Aseguradora de Riesgos Laborales)'` por `'Afiliacion ARL'`.

#### 2. Renombrar ARL en servicio de documentos (`src/services/documentoService.ts`)
- Cambiar el nombre `'ARL'` por `'Afiliacion ARL'` en las dos ocurrencias donde se genera el documento de tipo `arl`.

#### 3. Optimizar layout de filas individuales (`src/components/matriculas/DocumentosCarga.tsx`)

Cambios en la fila de cada documento (lineas 261-325):
- Reestructurar el layout para que el nombre del documento y el badge de estado se manejen correctamente en espacio reducido.
- Mover el Badge de estado debajo del nombre del documento (junto a la info del archivo) en lugar de tenerlo al lado derecho compitiendo por espacio con el boton de accion.
- Aplicar `overflow-hidden` al contenedor de la fila para prevenir desbordamientos.
- Reducir el `gap` entre elementos para aprovechar mejor el espacio.
- Asegurar que el nombre del documento tenga `truncate` y `min-w-0` en su contenedor padre.

Estructura propuesta por fila:
```
[Icono] [Nombre (truncate) + (opcional)]   [Cargar / Menu ...]
        [Badge estado]
        [Info archivo si existe]
        [Campos fecha si aplica]
```

#### 4. Tooltip ARL en DocumentosCarga
- Mantener el tooltip con la descripcion completa "Inicio de cobertura ARL" (ya esta correcto, sin el parentesis largo).

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/data/mockData.ts` | Renombrar "ARL (Aseguradora de Riesgos Laborales)" a "Afiliacion ARL" (5 ocurrencias) |
| `src/services/documentoService.ts` | Renombrar "ARL" a "Afiliacion ARL" (2 ocurrencias) |
| `src/components/matriculas/DocumentosCarga.tsx` | Reestructurar layout de filas para evitar desbordamientos y superposiciones |

