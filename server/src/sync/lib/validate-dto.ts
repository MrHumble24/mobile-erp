import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

/**
 * Validates a mutation payload against the owning module's DTO, mirroring the
 * global ValidationPipe (whitelist + implicit conversion) so a queued mutation
 * is held to the same rules as its live HTTP endpoint. Throws on invalid input.
 */
export async function validateDto<D extends object>(
  cls: new () => D,
  payload: unknown,
): Promise<D> {
  const instance = plainToInstance(cls, payload, {
    enableImplicitConversion: true,
  });
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errors.length > 0) {
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    throw new BadRequestException(messages.join('; ') || 'Invalid payload');
  }
  return instance;
}
