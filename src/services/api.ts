/**
 * Utilidades base para simulación de API
 * Todas las llamadas simulan latencia de red realista
 */

export const delay = (ms: number = 500): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms + Math.random() * 500));

export const simulateApiCall = async <T>(data: T, delayMs: number = 500): Promise<T> => {
  await delay(delayMs);
  return data;
};

export const simulateError = (probability: number = 0.1): boolean => {
  return Math.random() < probability;
};

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
