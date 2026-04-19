import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function exponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 10,
  initialDelay = 2000
): Promise<T> {
  let retries = 0;
  let delay = initialDelay;
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error: unknown) {
      retries++;
      if (retries >= maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error('Max retries reached');
}

export function getPriorityBadge(level: string): 'destructive' | 'default' | 'secondary' | 'outline' {
  switch (level) {
    case 'Alto':
    case 'Crítico':
    case 'Intolerable':
    case 'Importante':
    case 'Alta':
    case 'Crítica':
      return 'destructive';
    case 'Medio':
    case 'Moderado':
    case 'Media':
      return 'default';
    case 'Bajo':
    case 'Tolerable':
    case 'Baja':
      return 'secondary';
    default:
      return 'outline';
  }
}
