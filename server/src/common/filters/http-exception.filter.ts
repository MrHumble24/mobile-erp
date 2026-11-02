import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  [key: string]: unknown;
}

/** Normalizes every thrown error to `{ statusCode, message, error }`. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<{
      status: (code: number) => { json: (body: ErrorResponse) => void };
    }>();
    const isHttp = exception instanceof HttpException;
    const statusCode = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const { message, error, extra } = this.normalize(exception, isHttp);

    if (statusCode >= 500) {
      this.logger.error(
        Array.isArray(message) ? message.join('; ') : message,
        exception instanceof Error ? exception.stack : undefined,
      );
    }
    res.status(statusCode).json({ statusCode, message, error, ...extra });
  }

  private normalize(
    exception: unknown,
    isHttp: boolean,
  ): {
    message: string | string[];
    error: string;
    extra: Record<string, unknown>;
  } {
    if (isHttp && exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        return { message: body, error: exception.name, extra: {} };
      }
      // Preserve any extra fields the thrower attached (e.g. `problems`).
      const b = body as {
        message?: string | string[];
        error?: string;
      } & Record<string, unknown>;
      const extra = { ...b };
      delete extra.message;
      delete extra.error;
      delete extra.statusCode;
      return {
        message: b.message ?? exception.message,
        error: b.error ?? exception.name,
        extra,
      };
    }
    return {
      message: 'Internal server error',
      error: 'InternalServerError',
      extra: {},
    };
  }
}
