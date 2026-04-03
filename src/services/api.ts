/**
 * Utilidades base para API con Supabase
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Convert snake_case string to camelCase */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/** Convert camelCase string to snake_case */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/** Recursively convert all keys from snake_case to camelCase */
export function snakeToCamel<T = any>(obj: any): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel) as T;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj as T;

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toCamelCase(key)] = snakeToCamel(value);
  }
  return result as T;
}

/** Recursively convert all keys from camelCase to snake_case */
export function camelToSnake<T = any>(obj: any): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake) as T;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj as T;

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Don't convert JSONB values (they should stay as-is)
    const snakeKey = toSnakeCase(key);
    if (['campos_adicionales', 'config_codigo_estudiante', 'contacto_emergencia', 'campos_adicionales_valores'].includes(snakeKey)) {
      result[snakeKey] = value;
    } else {
      result[snakeKey] = camelToSnake(value);
    }
  }
  return result as T;
}

/** Handle Supabase query errors */
export function handleSupabaseError(error: any): never {
  if (error?.code === '23505') {
    throw new ApiError('Ya existe un registro con esos datos únicos', 400, 'DUPLICATE');
  }
  if (error?.code === '23503') {
    throw new ApiError('No se puede realizar la operación: hay registros relacionados', 400, 'FK_VIOLATION');
  }
  if (error?.message?.includes('contacto de emergencia')) {
    throw new ApiError(error.message, 400, 'CONTACTO_EMERGENCIA_INCOMPLETO');
  }
  if (error?.message?.includes('entrenador') || error?.message?.includes('supervisor')) {
    throw new ApiError(error.message, 400, 'ASIGNACION_INVALIDA');
  }
  throw new ApiError(error?.message || 'Error del servidor', 500);
}
