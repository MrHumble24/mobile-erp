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
    const { message, error } = this.normalize(exception, isHttp);

    if (statusCode >= 500) {
      this.logger.error(
        Array.isArray(message) ? message.join('; ') : message,
        exception instanceof Error ? exception.stack : undefined,
      );
    }
    res.status(statusCode).json({ statusCode, message, error });
  }

  private normalize(
    exception: unknown,
    isHttp: boolean,
  ): { message: string | string[]; error: string } {
    if (isHttp && exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        return { message: body, error: exception.name };
      }
      const b = body as { message?: string | string[]; error?: string };
      return {
        message: b.message ?? exception.message,
        error: b.error ?? exception.name,
      };
    }
    return { message: 'Internal server error', error: 'InternalServerError' };
  }
}
