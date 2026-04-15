import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Bloque,
  TipoBloque,
  CategoriaFormato,
  AsignacionScope,
  EncabezadoConfig,
  FormatoDependencia,
  EventoDisparador,
} from '@/types/formatoFormacion';


// ---------------------------------------------------------------------------
// Row layout containers (not field blocks)
// ---------------------------------------------------------------------------

export interface Row1Block {
  id: string;
  type: 'row1';
  col: Bloque | null;
}

export interface Row2Block {
  id: string;
  type: 'row2';
  cols: [(Bloque | null), (Bloque | null)];
}

export type EditorItem = Bloque | Row1Block | Row2Block;

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
  nivelFormacionIds: string[];
  visibleEnMatricula: boolean;
  visibleEnCurso: boolean;
  visibleEnPortalEstudiante: boolean;
  activo: boolean;
  modoDiligenciamiento: import('@/types/formatoFormacion').ModoDiligenciamiento;
  requiereFirmaAprendiz: boolean;
  requiereFirmaEntrenador: boolean;
  requiereFirmaSupervisor: boolean;
  usaEncabezadoInstitucional: boolean;
  encabezadoConfig: EncabezadoConfig;
  dependencias: FormatoDependencia[];
  eventosDisparadores: EventoDisparador[];
  esOrigenFirma: boolean;
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
  asignacionScope: 'todos',
  nivelFormacionIds: [],
  visibleEnMatricula: true,
  visibleEnCurso: false,
  visibleEnPortalEstudiante: false,
  activo: true,
  modoDiligenciamiento: 'manual_estudiante',
  requiereFirmaAprendiz: false,
  requiereFirmaEntrenador: false,
  requiereFirmaSupervisor: false,
  usaEncabezadoInstitucional: true,
  encabezadoConfig: DEFAULT_ENCABEZADO,
  dependencias: [],
  eventosDisparadores: [],
  esOrigenFirma: false,
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
  radio: { options: [{ value: 'opcion_1', label: 'Opción 1', default: false }, { value: 'opcion_2', label: 'Opción 2', default: false }] },
  select: { options: [{ value: 'opcion_1', label: 'Opción 1', default: false }, { value: 'opcion_2', label: 'Opción 2', default: false }] },
  multi_choice: { options: [{ value: 'opcion_1', label: 'Opción 1', default: false }, { value: 'opcion_2', label: 'Opción 2', default: false }] },
  auto_field: { key: 'nombre_aprendiz' },
  heading: { level: 2 },
  document_header: {
    logoUrl: '',
    empresaNombre: 'FREDDY IVAN HOYOS INSTRUCTORES Y FACILITADORES LTDA.',
    sistemaGestion: 'SISTEMA DE GESTIÓN INTEGRADO',
    subsistema: 'FORMACIÓN',
    fechaCreacion: '01/01/2025',
    fechaEdicion: '01/01/2025',
    codigo: '',
    version: '',
    mostrarCodigo: true,
    mostrarVersion: true,
    mostrarFechas: true,
    borderColor: '#9ca3af',
  },
};

export function createDefaultBlock(type: TipoBloque): Bloque {
  const base = { id: uuidv4(), type, label: '', required: false };
  const defaults = BLOCK_DEFAULTS[type];
  if (defaults) {
    return { ...base, props: { ...defaults } } as Bloque;
  }
  return base as Bloque;
}

export function createRow1(): Row1Block {
  return { id: uuidv4(), type: 'row1', col: null };
}

export function createRow2(): Row2Block {
  return { id: uuidv4(), type: 'row2', cols: [null, null] };
}

// ---------------------------------------------------------------------------
// History helpers
// ---------------------------------------------------------------------------

const MAX_HISTORY = 50;

function cloneItems(items: EditorItem[]): EditorItem[] {
  return JSON.parse(JSON.stringify(items));
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
  history: EditorItem[][];
  future: EditorItem[][];

  // Actions
  setItems: (items: EditorItem[]) => void;
  addBlock: (type: TipoBloque, atIndex?: number) => void;
  addRow1: (atIndex?: number) => void;
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
  undo: () => void;
  redo: () => void;
}

export const useFormatoEditorStore = create<FormatoEditorState>((set, get) => {
  /** Push current items snapshot to history, clear future */
  const pushHistory = () => {
    const { items, history } = get();
    const newHistory = [...history, cloneItems(items)];
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    set({ history: newHistory, future: [] });
  };

  return {
    items: [],
    selectedId: null,
    docTitle: 'Formato sin título',
    config: { ...DEFAULT_CONFIG },
    isDirty: false,
    history: [],
    future: [],

    setItems: (items) => { pushHistory(); set({ items, isDirty: true }); },

    addBlock: (type, atIndex) => {
      pushHistory();
      const block = createDefaultBlock(type);
      set((s) => {
        const items = [...s.items];
        const idx = atIndex ?? items.length;
        items.splice(idx, 0, block);
        return { items, selectedId: block.id, isDirty: true };
      });
    },

    addRow1: (atIndex) => {
      pushHistory();
      const row = createRow1();
      set((s) => {
        const items = [...s.items];
        const idx = atIndex ?? items.length;
        items.splice(idx, 0, row);
        return { items, isDirty: true };
      });
    },

    addRow2: (atIndex) => {
      pushHistory();
      const row = createRow2();
      set((s) => {
        const items = [...s.items];
        const idx = atIndex ?? items.length;
        items.splice(idx, 0, row);
        return { items, isDirty: true };
      });
    },

    removeBlock: (id) => { pushHistory(); set((s) => ({
      items: s.items.filter((it) => it.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      isDirty: true,
    })); },

    updateBlock: (id, updates) => { pushHistory(); set((s) => ({
      items: s.items.map((it): EditorItem => {
        if (it.id === id && it.type !== 'row2' && it.type !== 'row1') return { ...it, ...updates } as Bloque;
        if (it.type === 'row1') {
          const row = it as Row1Block;
          if (row.col && row.col.id === id) return { ...row, col: { ...row.col, ...updates } as Bloque };
          return it;
        }
        if (it.type === 'row2') {
          const row = it as Row2Block;
          return {
            ...row,
            cols: row.cols.map((c) => (c && c.id === id ? { ...c, ...updates } as Bloque : c)) as Row2Block['cols'],
          };
        }
        return it;
      }),
      isDirty: true,
    })); },

    reorderBlock: (from, to) => { pushHistory(); set((s) => {
      const items = [...s.items];
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      return { items, isDirty: true };
    }); },

    insertIntoCol: (rowId, colIndex, type) => {
      pushHistory();
      const block = createDefaultBlock(type);
      set((s) => ({
        items: s.items.map((it) => {
          if (it.id === rowId && it.type === 'row1') {
            return { ...it, col: block } as Row1Block;
          }
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

    removeFromCol: (rowId, colIndex) => { pushHistory(); set((s) => {
      let newSelectedId = s.selectedId;
      const items = s.items.map((it) => {
        if (it.id === rowId && it.type === 'row1') {
          const row = it as Row1Block;
          if (row.col?.id === s.selectedId) newSelectedId = null;
          return { ...row, col: null } as Row1Block;
        }
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
    }); },

    duplicateBlock: (id) => { pushHistory(); set((s) => {
      const idx = s.items.findIndex((it) => it.id === id);
      if (idx === -1) return s;
      const original = s.items[idx];
      if (original.type === 'row2') return s;
      const copy = { ...original, id: uuidv4() } as Bloque;
      const items = [...s.items];
      items.splice(idx + 1, 0, copy);
      return { items, selectedId: copy.id, isDirty: true };
    }); },

    setSelected: (id) => set({ selectedId: id }),
    setDocTitle: (title) => set({ docTitle: title, isDirty: true }),
    setConfig: (partial) => set((s) => ({ config: { ...s.config, ...partial }, isDirty: true })),
    markDirty: () => set({ isDirty: true }),
    markClean: () => set({ isDirty: false }),
    reset: () => set({ items: [], selectedId: null, docTitle: 'Formato sin título', config: { ...DEFAULT_CONFIG }, isDirty: false, history: [], future: [] }),

    loadFromFormato: (items, config, docTitle) => set({
      items,
      config,
      docTitle,
      selectedId: null,
      isDirty: false,
      history: [],
      future: [],
    }),

    undo: () => set((s) => {
      if (s.history.length === 0) return s;
      const newHistory = [...s.history];
      const prev = newHistory.pop()!;
      return {
        history: newHistory,
        future: [cloneItems(s.items), ...s.future],
        items: prev,
        isDirty: true,
        selectedId: null,
      };
    }),

    redo: () => set((s) => {
      if (s.future.length === 0) return s;
      const newFuture = [...s.future];
      const next = newFuture.shift()!;
      return {
        future: newFuture,
        history: [...s.history, cloneItems(s.items)],
        items: next,
        isDirty: true,
        selectedId: null,
      };
    }),

    getSelectedBlock: () => {
      const { items, selectedId } = get();
      if (!selectedId) return null;
      for (const it of items) {
        if (it.id === selectedId && it.type !== 'row2' && it.type !== 'row1') return it as Bloque;
        if (it.type === 'row1') {
          const row = it as Row1Block;
          if (row.col && row.col.id === selectedId) return row.col;
        }
        if (it.type === 'row2') {
          const row = it as Row2Block;
          for (const col of row.cols) {
            if (col && col.id === selectedId) return col;
          }
        }
      }
      return null;
    },
  };
});
