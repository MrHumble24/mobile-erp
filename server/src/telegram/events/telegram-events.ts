/** Event names emitted by owning services and consumed by the Telegram listener. */
export const TelegramEvents = {
  shipmentDevicesRegistered: 'shipment.devices-registered',
  saleCreated: 'sale.created',
  consignmentCreated: 'consignment.created',
  partnerPaymentReceived: 'partner.payment-received',
  repairCreated: 'repair.created',
  repairReady: 'repair.ready',
  repairGivenBack: 'repair.given-back',
} as const;

export class ShipmentDevicesRegisteredEvent {
  constructor(
    readonly shipmentId: string,
    readonly supplier: string,
    readonly count: number,
    readonly models: string[],
  ) {}
}

export class SaleCreatedEvent {
  constructor(
    readonly saleId: string,
    readonly imei: string,
    readonly model: string,
    readonly salePrice: number,
    readonly targetPrice: number | null,
    readonly landedCostSnapshot: number,
  ) {}
}

export class ConsignmentCreatedEvent {
  constructor(
    readonly partner: string,
    readonly imei: string,
    readonly agreedPrice: number,
    readonly dueDate: Date,
  ) {}
}

export class PartnerPaymentReceivedEvent {
  constructor(
    readonly partner: string,
    readonly amount: number,
  ) {}
}

/** Owner alerts for the repair desk (no customer messaging channel exists). */
export class RepairCreatedEvent {
  constructor(
    readonly ticketNumber: number,
    readonly customerName: string,
    readonly deviceName: string,
  ) {}
}

export class RepairReadyEvent {
  constructor(
    readonly ticketNumber: number,
    readonly deviceName: string,
  ) {}
}

export class RepairGivenBackEvent {
  constructor(
    readonly ticketNumber: number,
    readonly deviceName: string,
    readonly amountOwed: number,
  ) {}
}
