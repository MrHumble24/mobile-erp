import type { DeviceDetailView } from '../../devices/types/device.types.js';
import type { QuantityProductView } from '../../stock/types/stock.types.js';

/**
 * One scan lookup for the till (ADR 0030). A scanned/typed code is either a
 * unit (its IMEI, second IMEI or serial) or a quantity product's barcode.
 * Units win over barcodes; neither → 404.
 */
export type ScanResult =
  | { kind: 'unit'; unit: DeviceDetailView }
  | { kind: 'product'; product: QuantityProductView };
