export const saleSelect = {
  id: true,
  salePrice: true,
  landedCostSnapshot: true,
  listPriceSnapshot: true,
  priceLevelCode: true,
  soldAt: true,
  consignmentId: true,
  creditId: true,
  notes: true,
  quantity: true,
  device: {
    select: {
      imei: true,
      imei2: true,
      serialNumber: true,
      specs: true,
      model: { select: { brand: true, name: true, kindCode: true } },
    },
  },
  model: { select: { brand: true, name: true, kindCode: true } },
  customer: { select: { id: true, name: true, phone: true } },
  soldBy: {
    select: {
      id: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  },
  warranty: { select: { days: true, startsAt: true, endsAt: true } },
  return: {
    select: {
      returnedAt: true,
      refundAmount: true,
      reason: true,
      processedBy: {
        select: {
          id: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  },
} as const;
