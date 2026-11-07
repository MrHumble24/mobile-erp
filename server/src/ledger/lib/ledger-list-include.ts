import { Prisma } from '../../generated/client/client.js';

/** Relations a ledger row carries when listed (who, which device/sale/expense...). */
export const LIST_INCLUDE = {
  account: { select: { code: true, label: true } },
  type: { select: { code: true, label: true } },
  createdBy: {
    select: {
      id: true,
      email: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  },
  device: {
    select: {
      id: true,
      imei: true,
      model: { select: { id: true, name: true, brand: true } },
    },
  },
  shipment: {
    select: {
      id: true,
      supplier: { select: { id: true, name: true } },
    },
  },
  sale: {
    select: {
      id: true,
      clientMutationId: true,
      customer: { select: { id: true, name: true, phone: true } },
      device: {
        select: {
          id: true,
          imei: true,
          model: { select: { id: true, name: true, brand: true } },
        },
      },
      model: { select: { id: true, name: true, brand: true } },
      quantity: true,
    },
  },
  expense: {
    select: {
      id: true,
      vendor: true,
      description: true,
      category: { select: { id: true, name: true } },
    },
  },
  partnerPayment: {
    select: {
      id: true,
      partner: { select: { id: true, shopName: true } },
    },
  },
  customerPurchase: {
    select: {
      id: true,
      customer: { select: { id: true, name: true } },
      device: {
        select: {
          id: true,
          imei: true,
          model: { select: { id: true, name: true } },
        },
      },
    },
  },
  repairPayment: {
    select: {
      id: true,
      repair: {
        select: {
          id: true,
          ticketNumber: true,
          deviceName: true,
          customer: { select: { id: true, name: true } },
        },
      },
    },
  },
  creditPayment: {
    select: {
      id: true,
      credit: {
        select: {
          id: true,
          customer: { select: { id: true, name: true } },
        },
      },
    },
  },
} satisfies Prisma.CashTransactionInclude;
