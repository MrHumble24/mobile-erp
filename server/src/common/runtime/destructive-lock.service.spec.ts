import { DestructiveLockService } from './destructive-lock.service.js';

describe('DestructiveLockService', () => {
  it('lets the first caller take it and refuses the second', () => {
    const lock = new DestructiveLockService();
    expect(lock.tryAcquire('wipe')).toBe(true);
    expect(lock.tryAcquire('restore')).toBe(false);
    expect(lock.isHeld()).toBe(true);
    expect(lock.heldBy()).toBe('wipe');
  });

  it('is free again after release', () => {
    const lock = new DestructiveLockService();
    lock.tryAcquire('restore');
    lock.release();
    expect(lock.isHeld()).toBe(false);
    expect(lock.heldBy()).toBeNull();
    expect(lock.tryAcquire('wipe')).toBe(true);
  });
});
