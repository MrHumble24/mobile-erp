import { ConflictException } from '@nestjs/common';
import { PartnersService } from '../partners/partners.service.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { ConsignmentsRepository } from './consignments.repository.js';
import { ConsignmentsService } from './consignments.service.js';
import { ConsignmentsWriteRepository } from './consignments.write.repository.js';

const caller: AuthenticatedUser = {
  id: 'u1',
  email: 'c@x',
  permissions: new Set(),
};

function build() {
  const reads = { findByClientMutationId: jest.fn().mockResolvedValue(null) };
  const writes = { createTransfer: jest.fn().mockResolvedValue({ id: 'c1' }) };
  const partners = {
    assertWithinCreditLimit: jest.fn().mockResolvedValue(undefined),
  };
  const service = new ConsignmentsService(
    reads as unknown as ConsignmentsRepository,
    writes as unknown as ConsignmentsWriteRepository,
    partners as unknown as PartnersService,
  );
  return { service, reads, writes, partners };
}

const dto = {
  imei: '123456789012345',
  partnerId: '11111111-1111-1111-1111-111111111111',
  agreedPrice: 500,
  dueDate: '2026-12-01T00:00:00.000Z',
};

describe('ConsignmentsService.create', () => {
  it('is idempotent: returns the existing consignment without writing', async () => {
    const { service, reads, writes, partners } = build();
    reads.findByClientMutationId.mockResolvedValue({ id: 'existing' });
    const result = await service.create(caller, {
      ...dto,
      clientMutationId: 'k1',
    });
    expect(result).toEqual({ id: 'existing' });
    expect(partners.assertWithinCreditLimit).not.toHaveBeenCalled();
    expect(writes.createTransfer).not.toHaveBeenCalled();
  });

  it('rejects when the credit limit would be exceeded, before any write', async () => {
    const { service, writes, partners } = build();
    partners.assertWithinCreditLimit.mockRejectedValue(
      new ConflictException('limit'),
    );
    await expect(service.create(caller, dto)).rejects.toThrow(
      ConflictException,
    );
    expect(writes.createTransfer).not.toHaveBeenCalled();
  });

  it('checks credit then transfers with the caller as creator', async () => {
    const { service, writes, partners } = build();
    await service.create(caller, dto);
    expect(partners.assertWithinCreditLimit).toHaveBeenCalled();
    expect(writes.createTransfer).toHaveBeenCalledWith(
      expect.objectContaining({ imei: dto.imei, createdById: 'u1' }),
    );
  });
});
