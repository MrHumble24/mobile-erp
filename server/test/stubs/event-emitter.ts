// CommonJS stub for @nestjs/event-emitter (which ships ESM-only and cannot be
// required by ts-jest). Unit tests inject a mock emitter, so only the shapes
// imported by source files are needed. Production uses the real package.
export class EventEmitter2 {
  emit(): boolean {
    return true;
  }
}

export function OnEvent(): MethodDecorator {
  return () => undefined;
}

export class EventEmitterModule {
  static forRoot() {
    return {
      module: EventEmitterModule,
      global: true,
      providers: [EventEmitter2],
      exports: [EventEmitter2],
    };
  }
}
