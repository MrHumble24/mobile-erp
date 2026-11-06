import { Injectable } from '@nestjs/common';

/**
 * In-memory maintenance switch. A restore flips it on so every route but health
 * and the restore's own status answers 503, and scheduled jobs stand down. One
 * process, one flag: restore holds a lock, so there is never a second writer.
 */
@Injectable()
export class MaintenanceService {
  private active = false;
  private reason = '';

  begin(reason: string): void {
    this.active = true;
    this.reason = reason;
  }

  end(): void {
    this.active = false;
    this.reason = '';
  }

  isActive(): boolean {
    return this.active;
  }

  getReason(): string {
    return this.reason;
  }
}
