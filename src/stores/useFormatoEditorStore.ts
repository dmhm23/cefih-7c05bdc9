import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Bloque,
  TipoBloque,
  CategoriaFormato,
  AsignacionScope,
  EncabezadoConfig,
} from '@/types/formatoFormacion';
import type { TipoFormacion } from '@/types/curso';

// ---------------------------------------------------------------------------
// Row2 — 2-column layout container (not a field block)
// ---------------------------------------------------------------------------

export interface Row2Block {
  id: string;
  type: 'row2';
  cols: [(Bloque | null), (Bloque | null)];
}

export type EditorItem = Bloque | Row2Block;

// ---------------------------------------------------------------------------
// Format config (non-block metadata)
// ---------------------------------------------------------------------------

export interface FormatoConfig {
  nombre: string;
  descripcion: string;
  codigo: string;
  version: string;
  categoria: CategoriaFormato;
  asignacionScope: AsignacionScope;
  tipoCursoKeys: TipoFormacion[];
  nivelFormacionIds: string[];
  visibleEnMatricula: boolean;
  visibleEnCurso: boolean;
  activo: boolean;
  requiereFirmaAprendiz: boolean;
  requiereFirmaEntrenador: boolean;
  requiereFirmaSupervisor: boolean;
  usaEncabezadoInstitucional: boolean;
  encabezadoConfig: EncabezadoConfig;
}

const DEFAULT_ENCABEZADO: EncabezadoConfig = {
  mostrarLogo: true,
  mostrarNombreCentro: true,
  mostrarCodigoDocumento: true,
  mostrarVersion: true,
  mostrarFecha: true,
  mostrarPaginacion: false,
  alineacion: 'centro',
};

export const DEFAULT_CONFIG: FormatoConfig = {
  nombre: '',
  descripcion: '',
  codigo: '',
  version: '001',
  categoria: 'personalizado',
  asignacionScope: 'tipo_curso',
  tipoCursoKeys: [],
  nivelFormacionIds: [],
  visibleEnMatricula: true,
  visibleEnCurso: false,
  activo: true,
  requiereFirmaAprendiz: false,
  requiereFirmaEntrenador: false,
  requiereFirmaSupervisor: false,
  usaEncabezadoInstitucional: true,
  encabezadoConfig: DEFAULT_ENCABEZADO,
};

// ---------------------------------------------------------------------------
// Block defaults
// ---------------------------------------------------------------------------

const BLOCK_DEFAULTS: Partial<Record<TipoBloque, Record<string, unknown>>> = {
  text: { placeholder: 'Escribe aquí…' },
  textarea: { placeholder: 'Escribe aquí…' },
  number: { placeholder: '0' },
  email: { placeholder: 'correo@ejemplo.com' },
  paragraph: { text: '' },
  radio: { options: [{ value: 'opcion_1', label: 'Opción 1' }, { value: 'opcion_2', label: 'Opción 2' }] },
  select: { options: [{ value: 'opcion_1', label: 'Opción 1' }, { value: 'opcion_2', label: 'Opción 2' }] },
  auto_field: { key: 'nombre_aprendiz' },
  heading: { level: 2 },
};

export function createDefaultBlock(type: TipoBloque): Bloque {
  const base = { id: uuidv4(), type, label: '', required: false };
  const defaults = BLOCK_DEFAULTS[type];
  if (defaults) {
    return { ...base, props: { ...defaults } } as Bloque;
  }
  return base as Bloque;
}

export function createRow2(): Row2Block {
  return { id: uuidv4(), type: 'row2', cols: [null, null] };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface FormatoEditorState {
  items: EditorItem[];
  selectedId: string | null;
  docTitle: string;
  config: FormatoConfig;
  isDirty: boolean;

  // Actions
  setItems: (items: EditorItem[]) => void;
  addBlock: (type: TipoBloque, atIndex?: number) => void;
  addRow2: (atIndex?: number) => void;
  removeBlock: (id: string) => void;
  updateBlock: (id: string, updates: Partial<Bloque>) => void;
  reorderBlock: (fromIndex: number, toIndex: number) => void;
  insertIntoCol: (rowId: string, colIndex: number, type: TipoBloque) => void;
  removeFromCol: (rowId: string, colIndex: number) => void;
  duplicateBlock: (id: string) => void;
  setSelected: (id: string | null) => void;
  setDocTitle: (title: string) => void;
  setConfig: (config: Partial<FormatoConfig>) => void;
  markDirty: () => void;
  markClean: () => void;
  reset: () => void;
  loadFromFormato: (items: EditorItem[], config: FormatoConfig, docTitle: string) => void;
  getSelectedBlock: () => Bloque | null;
}

export const useFormatoEditorStore = create<FormatoEditorState>((set, get) => ({
  items: [],
  selectedId: null,
  docTitle: 'Formato sin título',
  config: { ...DEFAULT_CONFIG },
  isDirty: false,

  setItems: (items) => set({ items, isDirty: true }),

  addBlock: (type, atIndex) => {
    const block = createDefaultBlock(type);
    set((s) => {
      const items = [...s.items];
      const idx = atIndex ?? items.length;
      items.splice(idx, 0, block);
      return { items, selectedId: block.id, isDirty: true };
    });
  },

  addRow2: (atIndex) => {
    const row = createRow2();
    set((s) => {
      const items = [...s.items];
      const idx = atIndex ?? items.length;
      items.splice(idx, 0, row);
      return { items, isDirty: true };
    });
  },

  removeBlock: (id) => set((s) => ({
    items: s.items.filter((it) => it.id !== id),
    selectedId: s.selectedId === id ? null : s.selectedId,
    isDirty: true,
  })),

  updateBlock: (id, updates) => set((s) => ({
    items: s.items.map((it) => {
      if (it.id === id) return { ...it, ...updates };
      if (it.type === 'row2') {
        const row = it as Row2Block;
        return {
          ...row,
          cols: row.cols.map((c) => (c && c.id === id ? { ...c, ...updates } : c)) as Row2Block['cols'],
        };
      }
      return it;
    }),
    isDirty: true,
  })),

  reorderBlock: (from, to) => set((s) => {
    const items = [...s.items];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    return { items, isDirty: true };
  }),

  insertIntoCol: (rowId, colIndex, type) => {
    const block = createDefaultBlock(type);
    set((s) => ({
      items: s.items.map((it) => {
        if (it.id === rowId && it.type === 'row2') {
          const row = it as Row2Block;
          const cols = [...row.cols] as Row2Block['cols'];
          cols[colIndex] = block;
          return { ...row, cols };
        }
        return it;
      }),
      selectedId: block.id,
      isDirty: true,
    }));
  },

  removeFromCol: (rowId, colIndex) => set((s) => {
    let newSelectedId = s.selectedId;
    const items = s.items.map((it) => {
      if (it.id === rowId && it.type === 'row2') {
        const row = it as Row2Block;
        if (row.cols[colIndex]?.id === s.selectedId) newSelectedId = null;
        const cols = [...row.cols] as Row2Block['cols'];
        cols[colIndex] = null;
        return { ...row, cols };
      }
      return it;
    });
    return { items, selectedId: newSelectedId, isDirty: true };
  }),

  duplicateBlock: (id) => set((s) => {
    const idx = s.items.findIndex((it) => it.id === id);
    if (idx === -1) return s;
    const original = s.items[idx];
    if (original.type === 'row2') return s; // don't duplicate rows
    const copy = { ...original, id: uuidv4() } as Bloque;
    const items = [...s.items];
    items.splice(idx + 1, 0, copy);
    return { items, selectedId: copy.id, isDirty: true };
  }),

  setSelected: (id) => set({ selectedId: id }),
  setDocTitle: (title) => set({ docTitle: title, isDirty: true }),
  setConfig: (partial) => set((s) => ({ config: { ...s.config, ...partial }, isDirty: true })),
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
  reset: () => set({ items: [], selectedId: null, docTitle: 'Formato sin título', config: { ...DEFAULT_CONFIG }, isDirty: false }),

  loadFromFormato: (items, config, docTitle) => set({
    items,
    config,
    docTitle,
    selectedId: null,
    isDirty: false,
  }),

  getSelectedBlock: () => {
    const { items, selectedId } = get();
    if (!selectedId) return null;
    for (const it of items) {
      if (it.id === selectedId && it.type !== 'row2') return it as Bloque;
      if (it.type === 'row2') {
        const row = it as Row2Block;
        for (const col of row.cols) {
          if (col && col.id === selectedId) return col;
        }
      }
    }
    return null;
  },
}));
