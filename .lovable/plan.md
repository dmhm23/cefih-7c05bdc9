

## Plan: Aumentar tamaño de texto en el panel izquierdo (Bloques y Tokens)

### Escala propuesta

| Actual | Nuevo | Contexto |
|---|---|---|
| `text-[10px]` | `text-xs` (12px) | Section headers, badge counts |
| `text-[11px]` | `text-sm` (14px) | Block labels (campos, especiales) |
| `text-xs` (12px) | `text-sm` (14px) | Search input, tabs, token labels, category headers |
| `text-[9px]` | `text-xs` (12px) | Token badge count |
| `size={14}` icons | `size={16}` | Block icons |

### Cambios

**1. `src/components/formatos/editor/BlockCatalog.tsx`**

- Search input (L114): `text-xs` → `text-sm`
- Tabs Bloques/Tokens (L124, L130): `text-xs` → `text-sm`
- Section headers (L99): `text-[10px]` → `text-xs`
- Layout blocks (L153): `text-xs` → `text-sm`, icon `size={14}` → `size={16}`
- Field blocks (L172): `text-[11px]` → `text-sm`, icon `size={14}` → `size={16}`
- Special blocks (L192): `text-[11px]` → `text-sm`, icon `size={14}` → `size={16}`

**2. `src/components/formatos/TokenLibrary.tsx`**

- Search input (L45): `text-xs` → `text-sm`
- Category headers (L57): `text-xs` → `text-sm`
- Category badge (L65): `text-[9px]` → `text-xs`, `h-4` → `h-5`
- Token label (L93): `text-xs` → `text-sm`
- Token code (L96): `text-[10px]` → `text-xs`

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/components/formatos/editor/BlockCatalog.tsx` | Escalar textos e iconos un nivel arriba |
| `src/components/formatos/TokenLibrary.tsx` | Escalar textos un nivel arriba |

