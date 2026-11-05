import { NotFoundException } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service.js';
import { StockService } from '../stock/stock.service.js';
import { ScanService } from './scan.service.js';

function build() {
  const devices = {
    findByCode: jest.fn().mockResolvedValue(null),
  } as unknown as DevicesService;
  const stock = {
    findByBarcode: jest.fn().mockResolvedValue(null),
  } as unknown as StockService;
  return { service: new ScanService(devices, stock), devices, stock };
}

describe('ScanService.resolve', () => {
  it('returns a unit when the code identifies one', async () => {
    const { service, devices } = build();
    (devices.findByCode as jest.Mock).mockResolvedValue({ id: 'd1' });
    await expect(service.resolve('123456789012345')).resolves.toEqual({
      kind: 'unit',
      unit: { id: 'd1' },
    });
  });

  it('returns the quantity product when the code is a barcode', async () => {
    const { service, stock } = build();
    (stock.findByBarcode as jest.Mock).mockResolvedValue({ modelId: 'm1' });
    await expect(service.resolve('555')).resolves.toEqual({
      kind: 'product',
      product: { modelId: 'm1' },
    });
  });

  it('prefers a unit over a barcode (units win)', async () => {
    const { service, devices, stock } = build();
    (devices.findByCode as jest.Mock).mockResolvedValue({ id: 'd1' });
    (stock.findByBarcode as jest.Mock).mockResolvedValue({ modelId: 'm1' });
    const result = await service.resolve('ambiguous');
    expect(result.kind).toBe('unit');
    expect(stock.findByBarcode).not.toHaveBeenCalled();
  });

  it('404s when the code is neither a unit nor a barcode', async () => {
    const { service } = build();
    await expect(service.resolve('nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
