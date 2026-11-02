/**
 * Every Telegram message string lives here as a function returning English.
 * Gemini translates these to Uzbek via a handoff; keep NOTHING inline elsewhere.
 */

export function shipmentRegistered(p: {
  supplier: string;
  count: number;
  models: string[];
}): string {
  return (
    `New shipment received from ${p.supplier}: ${p.count} device(s).\n` +
    `Models: ${p.models.join(', ')}.`
  );
}

export function belowMarginSale(p: {
  imei: string;
  model: string;
  salePrice: number;
  targetPrice: number | null;
  marginPercent: number;
}): string {
  const target = p.targetPrice === null ? 'no target' : money(p.targetPrice);
  return (
    `Low-margin sale: ${p.model} (IMEI ${p.imei}).\n` +
    `Sold for ${money(p.salePrice)} (target ${target}, margin ${p.marginPercent.toFixed(1)}%).`
  );
}

export function consignmentCreated(p: {
  partner: string;
  imei: string;
  agreedPrice: number;
  dueDate: Date;
}): string {
  return (
    `Consignment to ${p.partner}: IMEI ${p.imei} at ${money(p.agreedPrice)}.\n` +
    `Due ${date(p.dueDate)}.`
  );
}

export function paymentReceived(p: {
  partner: string;
  amount: number;
}): string {
  return `Payment received from ${p.partner}: ${money(p.amount)}.`;
}

export function lowStock(
  rows: {
    modelId: string;
    storage: string;
    currentCount: number;
    threshold: number;
  }[],
): string {
  const lines = rows.map(
    (r) =>
      `- ${r.storage} (model ${short(r.modelId)}): ${r.currentCount}/${r.threshold}`,
  );
  return `Low stock alert:\n${lines.join('\n')}`;
}

export function overdueConsignments(
  rows: { partner: string; imei: string; agreedPrice: number; dueDate: Date }[],
): string {
  const lines = rows.map(
    (r) =>
      `- ${r.partner}: IMEI ${r.imei}, ${money(r.agreedPrice)}, due ${date(r.dueDate)}`,
  );
  return `Overdue consignments:\n${lines.join('\n')}`;
}

export function dailyDigest(p: {
  date: string;
  unitsSold: number;
  revenue: number;
  netProfit: number;
  expenses: number;
  outstanding: number;
}): string {
  return (
    `Daily closing for ${p.date}:\n` +
    `Units sold: ${p.unitsSold}\n` +
    `Revenue: ${money(p.revenue)}\n` +
    `Net profit: ${money(p.netProfit)}\n` +
    `Expenses: ${money(p.expenses)}\n` +
    `Outstanding consignment balance: ${money(p.outstanding)}`
  );
}

function money(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

function date(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function short(id: string): string {
  return id.slice(0, 8);
}
