import { HttpException } from '@nestjs/common';

/** Flattens any thrown error into a single human-readable string for a result. */
export function errorMessage(error: unknown): string {
  if (error instanceof HttpException) {
    const response = error.getResponse();
    if (typeof response === 'string') return response;
    const message = (response as { message?: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join('; ');
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
