import { isLegalMove, isTerminal } from './repair-status.js';

describe('repair status machine', () => {
  it('allows the forward path and cancellation', () => {
    expect(isLegalMove('RECEIVED', 'IN_REPAIR')).toBe(true);
    expect(isLegalMove('IN_REPAIR', 'READY')).toBe(true);
    expect(isLegalMove('READY', 'GIVEN_BACK')).toBe(true);
    expect(isLegalMove('RECEIVED', 'CANCELLED')).toBe(true);
    expect(isLegalMove('READY', 'IN_REPAIR')).toBe(true); // back for more work
  });

  it('refuses skipping to given-back and leaving terminal states', () => {
    expect(isLegalMove('RECEIVED', 'GIVEN_BACK')).toBe(false);
    expect(isLegalMove('GIVEN_BACK', 'READY')).toBe(false);
    expect(isLegalMove('CANCELLED', 'IN_REPAIR')).toBe(false);
  });

  it('marks given-back and cancelled as terminal', () => {
    expect(isTerminal('GIVEN_BACK')).toBe(true);
    expect(isTerminal('CANCELLED')).toBe(true);
    expect(isTerminal('READY')).toBe(false);
  });
});
