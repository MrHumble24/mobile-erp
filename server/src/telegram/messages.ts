/**
 * Every Telegram message string lives here as an Uzbek shop notification function.
 * Keep NOTHING inline elsewhere.
 */

export function shipmentRegistered(p: {
  supplier: string;
  count: number;
  models: string[];
}): string {
  return (
    `📦 Yangi partiya qabul qilindi: ${p.supplier}\n` +
    `Jami: ${p.count} ta qurilma\n` +
    `Modellar: ${p.models.join(', ')}`
  );
}

export function belowMarginSale(p: {
  imei: string;
  model: string;
  salePrice: number;
  targetPrice: number | null;
  marginPercent: number;
}): string {
  const target = p.targetPrice === null ? "maqsad narxi yo'q" : money(p.targetPrice);
  return (
    `⚠️ Past marjali savdo: ${p.model} (IMEI ${p.imei})\n` +
    `Sotildi: ${money(p.salePrice)} (mo'ljal: ${target}, marja: ${p.marginPercent.toFixed(1)}%)`
  );
}

export function consignmentCreated(p: {
  partner: string;
  imei: string;
  agreedPrice: number;
  dueDate: Date;
}): string {
  return (
    `🤝 Nasiyaga berildi: ${p.partner}\n` +
    `IMEI ${p.imei} — ${money(p.agreedPrice)}\n` +
    `Qaytarish muddati: ${date(p.dueDate)}`
  );
}

export function paymentReceived(p: {
  partner: string;
  amount: number;
}): string {
  return `💰 To'lov qabul qilindi (${p.partner}): ${money(p.amount)}`;
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
      `- ${r.storage} (model ${short(r.modelId)}): ${r.currentCount}/${r.threshold} ta`,
  );
  return `📉 Qoldiq kamaygan modellar:\n${lines.join('\n')}`;
}

export function overdueConsignments(
  rows: { partner: string; imei: string; agreedPrice: number; dueDate: Date }[],
): string {
  const lines = rows.map(
    (r) =>
      `- ${r.partner}: IMEI ${r.imei}, ${money(r.agreedPrice)}, muddati: ${date(r.dueDate)}`,
  );
  return `⏰ Muddati o'tgan nasiyalar:\n${lines.join('\n')}`;
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
    `📊 Kunlik yakuniy hisobot (${p.date}):\n` +
    `Sotilgan tovarlar: ${p.unitsSold} ta\n` +
    `Tushum: ${money(p.revenue)}\n` +
    `Sof foyda: ${money(p.netProfit)}\n` +
    `Xarajatlar: ${money(p.expenses)}\n` +
    `Nasiyadagi qoldiq: ${money(p.outstanding)}`
  );
}

function money(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

function date(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function short(id: string): string {
  return id.slice(0, 8);
}
