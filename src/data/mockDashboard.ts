import { GrupoCartera } from '@/types/cartera';
import { Matricula, NivelFormacionEmpresa, NIVEL_FORMACION_EMPRESA_LABELS } from '@/types/matricula';
import { Curso } from '@/types/curso';

// ============ METRIC CALCULATORS ============

export function calcTotalFacturadoPagado(grupos: GrupoCartera[]): number {
  return grupos
    .filter(g => g.estado === 'pagado')
    .reduce((sum, g) => sum + g.totalAbonos, 0);
}

export function calcCarteraPorCobrar(grupos: GrupoCartera[]): number {
  return grupos
    .filter(g => g.estado !== 'pagado')
    .reduce((sum, g) => sum + g.saldo, 0);
}

export function calcMatriculasIncompletas(matriculas: Matricula[]): number {
  return matriculas.filter(m => {
    const obligatorios = m.documentos.filter(d => !d.opcional);
    return obligatorios.length > 0 && obligatorios.some(d => d.estado === 'pendiente');
  }).length;
}

export function calcCursosSinCerrar(cursos: Curso[]): number {
  const hoy = new Date().toISOString().slice(0, 10);
  return cursos.filter(c => c.estado === 'en_progreso' && c.fechaFin <= hoy).length;
}

export function calcPendientesMinTrabajo(cursos: Curso[]): number {
  return cursos.filter(c => c.estado === 'cerrado' && !c.minTrabajoRegistro).length;
}

// ============ CHART DATA GENERATORS ============

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export interface TimeSeriesPoint {
  mes: string;
  valor: number;
}

export interface NivelDistribucion {
  nivel: string;
  cantidad: number;
  fill: string;
}

const NIVEL_COLORS: Record<string, string> = {
  jefe_area: 'hsl(220, 60%, 50%)',
  trabajador_autorizado: 'hsl(142, 71%, 45%)',
  reentrenamiento: 'hsl(38, 92%, 50%)',
  coordinador_ta: 'hsl(0, 84%, 60%)',
};

export function generateVolumenMatriculas(): TimeSeriesPoint[] {
  const data = [12, 18, 15, 22, 28, 25, 30, 20, 24, 32, 26, 19];
  return data.map((v, i) => ({ mes: MESES[i], valor: v }));
}

export function generateIngresosTiempo(): TimeSeriesPoint[] {
  const data = [
    3200000, 4800000, 4100000, 5600000, 7200000, 6500000,
    8100000, 5300000, 6200000, 8500000, 6800000, 4900000,
  ];
  return data.map((v, i) => ({ mes: MESES[i], valor: v }));
}

export function generateDistribucionNivel(matriculas: Matricula[]): NivelDistribucion[] {
  const conteo: Record<string, number> = {};
  matriculas.forEach(m => {
    const nivel = m.empresaNivelFormacion || 'sin_nivel';
    conteo[nivel] = (conteo[nivel] || 0) + 1;
  });

  return Object.entries(conteo)
    .filter(([k]) => k !== 'sin_nivel')
    .map(([k, v]) => ({
      nivel: NIVEL_FORMACION_EMPRESA_LABELS[k as NivelFormacionEmpresa] || k,
      cantidad: v,
      fill: NIVEL_COLORS[k] || 'hsl(220, 15%, 50%)',
    }));
}

export function filterByPeriod(data: TimeSeriesPoint[], period: 'trimestre' | 'semestre' | 'anual'): TimeSeriesPoint[] {
  const count = period === 'trimestre' ? 3 : period === 'semestre' ? 6 : 12;
  return data.slice(-count);
}

// ============ TODO WIDGET ============

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

export function loadTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem('dashboard_todos');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTodos(todos: TodoItem[]) {
  localStorage.setItem('dashboard_todos', JSON.stringify(todos));
}

export function loadHistory(): TodoItem[] {
  try {
    const raw = localStorage.getItem('dashboard_todo_history');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: TodoItem[]) {
  localStorage.setItem('dashboard_todo_history', JSON.stringify(history));
}
