import { registerDecorator, ValidationOptions } from 'class-validator';
import { isValidSessionDuration } from '../lib/session-duration.js';
import { isValidTimeZone } from '../lib/time-zone-validation.js';

export function IsSessionDuration(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSessionDuration',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a valid duration between 5m and 30d (e.g. "15m", "12h", "7d")`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          return (
            value === undefined ||
            value === null ||
            isValidSessionDuration(value)
          );
        },
      },
    });
  };
}

export function IsSupportedTimeZone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSupportedTimeZone',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a valid IANA time zone from Intl.supportedValuesOf('timeZone')`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          return (
            value === undefined || value === null || isValidTimeZone(value)
          );
        },
      },
    });
  };
}
