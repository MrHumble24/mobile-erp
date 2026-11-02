// CommonJS stub for @nestjs/schedule (ESM-only; see event-emitter.ts). The cron
// classes are not unit-tested; their scheduling logic lives in pure lib helpers.
export function Cron(): MethodDecorator {
  return () => undefined;
}

export const CronExpression = {
  EVERY_MINUTE: '* * * * *',
  EVERY_DAY_AT_9AM: '0 9 * * *',
};

export class ScheduleModule {
  static forRoot() {
    return { module: ScheduleModule };
  }
}
