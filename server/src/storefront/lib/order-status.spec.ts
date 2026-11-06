import { BadRequestException } from '@nestjs/common';
import {
  allowedNextOrderStatuses,
  assertValidTransition,
  isTerminalOrderStatus,
} from './order-status.js';

describe('order-status transitions', () => {
  describe('isTerminalOrderStatus', () => {
    it('returns true for DONE and CANCELLED', () => {
      expect(isTerminalOrderStatus('DONE')).toBe(true);
      expect(isTerminalOrderStatus('CANCELLED')).toBe(true);
      expect(isTerminalOrderStatus('NEW')).toBe(false);
      expect(isTerminalOrderStatus('CONTACTED')).toBe(false);
      expect(isTerminalOrderStatus('SHIPPED')).toBe(false);
    });
  });

  describe('allowedNextOrderStatuses', () => {
    it('PICKUP order allowed transitions', () => {
      expect(allowedNextOrderStatuses('NEW', 'PICKUP')).toEqual([
        'CONTACTED',
        'CANCELLED',
      ]);
      expect(allowedNextOrderStatuses('CONTACTED', 'PICKUP')).toEqual([
        'DONE',
        'CANCELLED',
      ]);
      expect(allowedNextOrderStatuses('DONE', 'PICKUP')).toEqual([]);
      expect(allowedNextOrderStatuses('CANCELLED', 'PICKUP')).toEqual([]);
    });

    it('DELIVERY order allowed transitions', () => {
      expect(allowedNextOrderStatuses('NEW', 'DELIVERY')).toEqual([
        'CONTACTED',
        'CANCELLED',
      ]);
      expect(allowedNextOrderStatuses('CONTACTED', 'DELIVERY')).toEqual([
        'SHIPPED',
        'DONE',
        'CANCELLED',
      ]);
      expect(allowedNextOrderStatuses('SHIPPED', 'DELIVERY')).toEqual([
        'DONE',
        'CANCELLED',
      ]);
      expect(allowedNextOrderStatuses('DONE', 'DELIVERY')).toEqual([]);
    });
  });

  describe('assertValidTransition', () => {
    it('allows valid transitions for pickup', () => {
      expect(() =>
        assertValidTransition('NEW', 'CONTACTED', 'PICKUP'),
      ).not.toThrow();
      expect(() =>
        assertValidTransition('CONTACTED', 'DONE', 'PICKUP'),
      ).not.toThrow();
      expect(() =>
        assertValidTransition('NEW', 'CANCELLED', 'PICKUP'),
      ).not.toThrow();
    });

    it('rejects SHIPPED for pickup order', () => {
      expect(() =>
        assertValidTransition('CONTACTED', 'SHIPPED', 'PICKUP'),
      ).toThrow(BadRequestException);
    });

    it('allows SHIPPED only for delivery order', () => {
      expect(() =>
        assertValidTransition('CONTACTED', 'SHIPPED', 'DELIVERY'),
      ).not.toThrow();
      expect(() =>
        assertValidTransition('SHIPPED', 'DONE', 'DELIVERY'),
      ).not.toThrow();
      expect(() =>
        assertValidTransition('SHIPPED', 'CANCELLED', 'DELIVERY'),
      ).not.toThrow();
    });

    it('rejects modifying terminal status', () => {
      expect(() => assertValidTransition('DONE', 'NEW', 'PICKUP')).toThrow(
        BadRequestException,
      );
      expect(() =>
        assertValidTransition('CANCELLED', 'CONTACTED', 'DELIVERY'),
      ).toThrow(BadRequestException);
    });
  });
});
