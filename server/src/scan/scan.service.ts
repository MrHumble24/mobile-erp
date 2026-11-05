import { Injectable, NotFoundException } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service.js';
import { StockService } from '../stock/stock.service.js';
import type { ScanResult } from './types/scan.types.js';

/**
 * Resolves a scanned or typed code for the POS: a unit (IMEI / second IMEI /
 * serial) or a quantity product's barcode. Units win over barcodes (ADR 0030).
 */
@Injectable()
export class ScanService {
  constructor(
    private readonly devices: DevicesService,
    private readonly stock: StockService,
  ) {}

  async resolve(rawCode: string): Promise<ScanResult> {
    const code = rawCode.trim();
    const unit = await this.devices.findByCode(code);
    if (unit) return { kind: 'unit', unit };
    const product = await this.stock.findByBarcode(code);
    if (product) return { kind: 'product', product };
    throw new NotFoundException(`No unit or product found for code ${code}`);
  }
}
