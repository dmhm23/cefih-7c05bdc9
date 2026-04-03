import { supabase } from '@/integrations/supabase/client';

// ============ TYPES ============

export interface TimeSeriesPoint {
  mes: string;
  valor: number;
}

export interface NivelDistribucion {
  nivel: string;
  cantidad: number;
  fill: string;
}

export interface DashboardStats {
  facturadoPagado: number;
  carteraPendiente: number;
  matriculasIncompletas: number;
  cursosSinCerrar: number;
  pendientesMinTrabajo: number;
}

export interface DashboardChartsData {
  matriculasPorMes: TimeSeriesPoint[];
  ingresosPorMes: TimeSeriesPoint[];
  distribucionTipoFormacion: NivelDistribucion[];
}

// ============ COLORS ============

const TIPO_FORMACION_COLORS: Record<string, string> = {
  formacion_inicial: 'hsl(220, 60%, 50%)',
  reentrenamiento: 'hsl(38, 92%, 50%)',
  jefe_area: 'hsl(142, 71%, 45%)',
  coordinador_alturas: 'hsl(0, 84%, 60%)',
};

const TIPO_FORMACION_LABELS: Record<string, string> = {
  formacion_inicial: 'Formación Inicial',
  reentrenamiento: 'Reentrenamiento',
  jefe_area: 'Jefe de Área',
  coordinador_alturas: 'Coordinador Alturas',
};

// ============ RPC CALLS ============

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('get_dashboard_stats');
  if (error) throw error;

  const d = data as Record<string, number>;
  return {
    facturadoPagado: d.facturadoPagado ?? 0,
    carteraPendiente: d.carteraPendiente ?? 0,
    matriculasIncompletas: d.matriculasIncompletas ?? 0,
    cursosSinCerrar: d.cursosSinCerrar ?? 0,
    pendientesMinTrabajo: d.pendientesMinTrabajo ?? 0,
  };
}

export async function fetchDashboardCharts(periodo: 'trimestre' | 'semestre' | 'anual' = 'anual'): Promise<DashboardChartsData> {
  const { data, error } = await supabase.rpc('get_dashboard_charts_data', { p_periodo: periodo });
  if (error) throw error;

  const d = data as Record<string, unknown[]>;

  return {
    matriculasPorMes: ((d.matriculasPorMes || []) as Array<{ mes: string; valor: number }>).map(p => ({
      mes: p.mes,
      valor: Number(p.valor),
    })),
    ingresosPorMes: ((d.ingresosPorMes || []) as Array<{ mes: string; valor: number }>).map(p => ({
      mes: p.mes,
      valor: Number(p.valor),
    })),
    distribucionTipoFormacion: ((d.distribucionTipoFormacion || []) as Array<{ nivel: string; cantidad: number }>).map(p => ({
      nivel: TIPO_FORMACION_LABELS[p.nivel] || p.nivel,
      cantidad: Number(p.cantidad),
      fill: TIPO_FORMACION_COLORS[p.nivel] || 'hsl(220, 15%, 50%)',
    })),
  };
}

// ============ TODO WIDGET (localStorage — sin cambios) ============

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
