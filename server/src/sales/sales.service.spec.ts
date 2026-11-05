import { SalesCreateService } from './sales-create.service.js';
import { SalesReadService } from './sales-read.service.js';
import { SalesService } from './sales.service.js';

/** The facade is pure delegation: reads → SalesReadService, create → SalesCreateService. */
describe('SalesService facade', () => {
  const read = {
    receipt: jest.fn().mockResolvedValue({ saleId: 'sale-1' }),
    list: jest.fn().mockResolvedValue({ items: [] }),
  };
  const writes = { create: jest.fn().mockResolvedValue({ id: 'sale-1' }) };
  const service = new SalesService(
    read as unknown as SalesReadService,
    writes as unknown as SalesCreateService,
  );

  it('delegates receipt to the read service', async () => {
    await service.receipt('sale-1');
    expect(read.receipt).toHaveBeenCalledWith('sale-1');
  });

  it('delegates create to the create service', async () => {
    const caller = { id: 'u1', email: 'e', permissions: new Set<string>() };
    const dto = { imei: '123456789012345', salePrice: 10 } as never;
    await service.create(caller, dto);
    expect(writes.create).toHaveBeenCalledWith(caller, dto, undefined);
  });
});
