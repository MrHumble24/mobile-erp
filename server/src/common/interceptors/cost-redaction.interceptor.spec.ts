import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { CostRedactionInterceptor } from './cost-redaction.interceptor.js';

function run(permissions: string[], data: unknown): Promise<unknown> {
  const interceptor = new CostRedactionInterceptor();
  const ctx = {
    switchToHttp: () => ({
      getRequest: () => ({ user: { permissions: new Set(permissions) } }),
    }),
  } as unknown as ExecutionContext;
  const next: CallHandler = { handle: () => of(data) };
  return lastValueFrom(interceptor.intercept(ctx, next));
}

describe('CostRedactionInterceptor', () => {
  it('strips cost keys without device.cost.view', async () => {
    const out = (await run([], {
      imei: '123',
      acquisitionCost: 100,
      landedCost: 110,
      landedCostSnapshot: 110,
    })) as Record<string, unknown>;
    expect(out).toEqual({ imei: '123' });
  });

  it('keeps cost keys with device.cost.view', async () => {
    const out = (await run(['device.cost.view'], {
      imei: '123',
      acquisitionCost: 100,
    })) as Record<string, unknown>;
    expect(out.acquisitionCost).toBe(100);
  });

  it('strips netProfit without sale.profit.view but keeps it with', async () => {
    const stripped = (await run([], { total: 500, netProfit: 50 })) as Record<
      string,
      unknown
    >;
    expect(stripped).toEqual({ total: 500 });
    const kept = (await run(['sale.profit.view'], {
      total: 500,
      netProfit: 50,
    })) as Record<string, unknown>;
    expect(kept.netProfit).toBe(50);
  });

  it('strips report cost aliases without device.cost.view', async () => {
    const out = (await run([], {
      revenue: 1000,
      cogs: 400,
      inStockLandedValue: 9000,
      byModel: [{ label: 'X', units: 3, landedValue: 300 }],
      avgAcquisitionCost: 100,
      avgLandedCost: 110,
    })) as any;
    expect(out).toEqual({ revenue: 1000, byModel: [{ label: 'X', units: 3 }] });
  });

  it('strips derived profit aliases without sale.profit.view', async () => {
    const out = (await run(['device.cost.view'], {
      revenue: 1000,
      cogs: 400,
      grossProfit: 600,
      netOperatingIncome: 500,
    })) as Record<string, unknown>;
    expect(out).toEqual({ revenue: 1000, cogs: 400 });
  });

  it('keeps aliases when both finance permissions are held', async () => {
    const out = (await run(['device.cost.view', 'sale.profit.view'], {
      cogs: 400,
      grossProfit: 600,
      landedValue: 300,
    })) as Record<string, unknown>;
    expect(out).toEqual({ cogs: 400, grossProfit: 600, landedValue: 300 });
  });

  it('recurses into nested objects and arrays', async () => {
    const out = (await run([], {
      items: [
        { imei: 'a', acquisitionCost: 10 },
        { imei: 'b', landedCost: 20 },
      ],
      meta: { nested: { netProfit: 9, keep: 1 } },
    })) as any;
    expect(out.items).toEqual([{ imei: 'a' }, { imei: 'b' }]);
    expect(out.meta.nested).toEqual({ keep: 1 });
  });

  it('defaults to deny when no user is present', async () => {
    const interceptor = new CostRedactionInterceptor();
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({}) }),
    } as unknown as ExecutionContext;
    const next: CallHandler = {
      handle: () => of({ acquisitionCost: 1, x: 2 }),
    };
    const out = (await lastValueFrom(
      interceptor.intercept(ctx, next),
    )) as Record<string, unknown>;
    expect(out).toEqual({ x: 2 });
  });
});
