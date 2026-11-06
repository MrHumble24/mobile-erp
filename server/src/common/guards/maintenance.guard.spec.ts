import { ServiceUnavailableException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MaintenanceGuard } from './maintenance.guard.js';
import { MaintenanceService } from '../runtime/maintenance.service.js';

function ctx() {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
  } as never;
}

describe('MaintenanceGuard', () => {
  function make(active: boolean, allowed: boolean) {
    const maintenance = new MaintenanceService();
    if (active) maintenance.begin('restore');
    const reflector = {
      getAllAndOverride: () => allowed,
    } as unknown as Reflector;
    return new MaintenanceGuard(reflector, maintenance);
  }

  it('lets everything through when not in maintenance', () => {
    expect(make(false, false).canActivate(ctx())).toBe(true);
  });

  it('returns 503 MAINTENANCE for an ordinary route during a restore', () => {
    try {
      make(true, false).canActivate(ctx());
      fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ServiceUnavailableException);
      expect((err as ServiceUnavailableException).getResponse()).toMatchObject({
        code: 'MAINTENANCE',
      });
    }
  });

  it('allows a route marked @AllowDuringMaintenance during a restore', () => {
    expect(make(true, true).canActivate(ctx())).toBe(true);
  });
});
