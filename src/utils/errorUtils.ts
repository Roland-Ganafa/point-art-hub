export interface AppError {
  message?: string;
  code?: string;
  status?: number;
  details?: string;
  hint?: string;
  name?: string;
  stack?: string;
}

export function asAppError(error: unknown): AppError {
  if (error instanceof Error) {
    return { message: error.message, name: error.name, stack: error.stack };
  }
  if (error && typeof error === 'object') {
    return error as AppError;
  }
  return { message: String(error) };
}

export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  const e = asAppError(error);
  return e.message ?? fallback;
}
