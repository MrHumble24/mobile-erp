import 'reflect-metadata';
import { PERMISSIONS_KEY } from '../common/decorators/require-permissions.decorator.js';
import { LedgerController } from './ledger.controller.js';

const perms = (handler: unknown): string[] =>
  Reflect.getMetadata(PERMISSIONS_KEY, handler as object);

describe('LedgerController route permissions', () => {
  it('guards every read with balance.read', () => {
    expect(perms(LedgerController.prototype.balances)).toEqual([
      'balance.read',
    ]);
    expect(perms(LedgerController.prototype.list)).toEqual(['balance.read']);
  });

  it('guards every write with balance.manage', () => {
    expect(perms(LedgerController.prototype.create)).toEqual([
      'balance.manage',
    ]);
    expect(perms(LedgerController.prototype.transfer)).toEqual([
      'balance.manage',
    ]);
  });
});
