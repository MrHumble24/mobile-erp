import { BadRequestException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { DeviceModelsService } from '../device-models/device-models.service.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ShiftsService } from '../shifts/shifts.service.js';
import { StoresService } from '../stores/stores.service.js';
import { CustomerPurchasesRepository } from './customer-purchases.repository.js';
import { CustomerPurchasesService } from './customer-purchases.service.js';
import { CustomerPurchasesWriteRepository } from './customer-purchases.write.repository.js';
import { CreateCustomerPurchaseDto } from './dto/create-customer-purchase.dto.js';

const caller: AuthenticatedUser = {
  id: 'u-1',
  email: 'c@x',
  permissions: new Set(['purchase.create']),
};

const row = {
  id: 'p-1',
  pricePaid: new Prisma.Decimal(3_000_000),
  saleId: null,
  occurredAt: new Date('2026-11-05T10:00:00Z'),
  customer: { id: 'cust-1', name: 'Ali', phone: '+998901112233' },
  device: {
    id: 'dev-1',
    imei: '111111111111111',
    imei2: null,
    serialNumber: null,
    model: { id: 'm-1', brand: 'Apple', name: 'iPhone 15', kindCode: 'IMEI' },
  },
  createdBy: { id: 'u-1', profile: { firstName: 'Cash', lastName: 'Ier' } },
};

function build(kindCode = 'IMEI') {
  const prisma = {
    customer: {
      findUnique: jest.fn().mockResolvedValue({ id: 'cust-1' }),
      upsert: jest.fn().mockResolvedValue({ id: 'cust-new' }),
      create: jest.fn().mockResolvedValue({ id: 'cust-new' }),
    },
  };
  const repo = {
    findById: jest.fn().mockResolvedValue(row),
    tradeInTotalForSale: jest.fn(),
  };
  const writes = { create: jest.fn().mockResolvedValue({ purchaseId: 'p-1' }) };
  const models = {
    get: jest.fn().mockResolvedValue({ kindCode, attributes: [] }),
  };
  const ledger = {
    activeAccountCodes: jest.fn().mockResolvedValue(['CASH', 'CARD']),
    customerPurchaseAccounts: jest
      .fn()
      .mockResolvedValue(new Map([['p-1', 'CASH']])),
  };
  const stores = {
    currentStoreId: jest.fn().mockResolvedValue('store-1'),
    currentStoreIds: jest.fn().mockResolvedValue(['store-1']),
  };
  const shifts = { assertCanSell: jest.fn().mockResolvedValue(undefined) };
  const service = new CustomerPurchasesService(
    prisma as unknown as PrismaService,
    repo as unknown as CustomerPurchasesRepository,
    writes as unknown as CustomerPurchasesWriteRepository,
    models as unknown as DeviceModelsService,
    ledger as unknown as LedgerService,
    stores as unknown as StoresService,
    shifts as unknown as ShiftsService,
  );
  return { service, prisma, repo, writes, models, ledger, shifts };
}

const dto = (extra: object): CreateCustomerPurchaseDto => ({
  modelId: 'm-1',
  imei: '111111111111111',
  pricePaid: 3_000_000,
  ...extra,
});

describe('CustomerPurchasesService.create', () => {
  it('buys a unit and posts the money out of CASH by default', async () => {
    const { service, writes, shifts } = build();
    await service.create(caller, dto({ customerId: 'cust-1' }));
    expect(shifts.assertCanSell).toHaveBeenCalled();
    expect(writes.create).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 'store-1',
        customerId: 'cust-1',
        pricePaid: 3_000_000,
        ledgerAccountCode: 'CASH',
      }),
    );
  });

  it('honours the chosen CARD account', async () => {
    const { service, writes } = build();
    await service.create(
      caller,
      dto({ customerId: 'cust-1', accountCode: 'CARD' }),
    );
    expect(writes.create).toHaveBeenCalledWith(
      expect.objectContaining({ ledgerAccountCode: 'CARD' }),
    );
  });

  it('rejects an unknown account', async () => {
    const { service, writes } = build();
    await expect(
      service.create(
        caller,
        dto({ customerId: 'cust-1', accountCode: 'BANK' }),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(writes.create).not.toHaveBeenCalled();
  });

  it('rejects a quantity product (not stocked as a unit)', async () => {
    const { service, writes } = build('QUANTITY');
    await expect(
      service.create(caller, dto({ customerId: 'cust-1' })),
    ).rejects.toThrow(BadRequestException);
    expect(writes.create).not.toHaveBeenCalled();
  });

  it('creates a seller from name + phone when no id is given', async () => {
    const { service, prisma } = build();
    await service.create(
      caller,
      dto({ customer: { name: 'Vali', phone: '+998901234567' } }),
    );
    expect(prisma.customer.upsert).toHaveBeenCalled();
  });

  it('rejects when neither a seller id nor name is given', async () => {
    const { service } = build();
    await expect(service.create(caller, dto({}))).rejects.toThrow(
      BadRequestException,
    );
  });
});

describe('CustomerPurchasesService.get', () => {
  it('maps the purchase with its ledger account', async () => {
    const { service } = build();
    const view = await service.get('p-1');
    expect(view).toMatchObject({
      id: 'p-1',
      pricePaid: '3000000.00',
      accountCode: 'CASH',
      unit: { imei: '111111111111111' },
    });
  });
});
