import { CreateSaleDto } from '../../sales/dto/create-sale.dto.js';
import { SalesService } from '../../sales/sales.service.js';
import { SyncRepository } from '../sync.repository.js';
import type { MutationContext } from './sync-handler.interface.js';
import { SaleCreateHandler } from './sale-create.handler.js';

function build() {
  const sales = {
    findByClientMutationId: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 'sale-1' }),
  };
  const repo = { deviceIdByCode: jest.fn().mockResolvedValue('dev-1') };
  const handler = new SaleCreateHandler(
    sales as unknown as SalesService,
    repo as unknown as SyncRepository,
  );
  return { handler, sales, repo };
}

const ctx: MutationContext = {
  caller: { id: 'u1', email: 'c@x', permissions: new Set() },
  mutationId: 'm-1',
  baseVersion: 2,
};

describe('SaleCreateHandler (offline replay by serial)', () => {
  it('resolves the contended device from a serial number', async () => {
    const { handler, repo } = build();
    const dto = Object.assign(new CreateSaleDto(), { serialNumber: ' sn-1 ' });
    await handler.deviceId(dto);
    expect(repo.deviceIdByCode).toHaveBeenCalledWith('SN-1');
  });

  it('replays idempotently: a prior sale is returned without re-applying', async () => {
    const { handler, sales } = build();
    sales.findByClientMutationId.mockResolvedValue({ id: 'sale-prev' });
    const dto = Object.assign(new CreateSaleDto(), { serialNumber: 'SN-1' });
    // The sync service calls findExisting before apply; the sale service itself
    // is idempotent on clientMutationId (asserted in sales.service.spec).
    const existing = await handler.findExisting(ctx, dto);
    expect(existing).toMatchObject({ id: 'sale-prev' });
  });

  it('applies with the mutation id and base version threaded in', async () => {
    const { handler, sales } = build();
    const dto = Object.assign(new CreateSaleDto(), {
      serialNumber: 'SN-1',
      salePrice: 250,
    });
    await handler.apply(ctx, dto);
    expect(dto.clientMutationId).toBe('m-1');
    expect(dto.expectedVersion).toBe(2);
    expect(sales.create).toHaveBeenCalledWith(ctx.caller, dto, {
      trustClientPrice: true,
      fromSync: true,
    });
  });
});
