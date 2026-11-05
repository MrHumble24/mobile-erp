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
  const target =
    p.targetPrice === null ? "maqsad narxi yo'q" : money(p.targetPrice);
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

export function overdueCredits(
  rows: { customer: string; overdueAmount: number }[],
): string {
  // English placeholder; Uzbek copy comes from the i18n team later.
  const lines = rows.map(
    (r) => `- ${r.customer}: ${money(r.overdueAmount)} overdue`,
  );
  return `⏰ Overdue customer credit:\n${lines.join('\n')}`;
}

/** One account's balance at the day's start and now (decimal strings). */
export interface DigestBalanceLine {
  label: string;
  opening: string;
  closing: string;
}

export function dailyDigest(p: {
  date: string;
  unitsSold: number;
  revenue: number;
  netProfit: number;
  expenses: number;
  outstanding: number;
  balances: {
    accounts: DigestBalanceLine[];
    openingTotal: string;
    closingTotal: string;
  };
}): string {
  // English placeholders; Uzbek copy comes from the i18n team later.
  const balanceLines = [
    ...p.balances.accounts.map(
      (a) => `${a.label}: ${moneyStr(a.opening)} -> ${moneyStr(a.closing)}`,
    ),
    `Total: ${moneyStr(p.balances.openingTotal)} -> ${moneyStr(p.balances.closingTotal)}`,
  ];
  return (
    `📊 Kunlik yakuniy hisobot (${p.date}):\n` +
    `Sotilgan tovarlar: ${p.unitsSold} ta\n` +
    `Tushum: ${money(p.revenue)}\n` +
    `Sof foyda: ${money(p.netProfit)}\n` +
    `Xarajatlar: ${money(p.expenses)}\n` +
    `Nasiyadagi qoldiq: ${money(p.outstanding)}\n` +
    `Balance (start -> now):\n${balanceLines.join('\n')}`
  );
}

function money(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

/** Balance strings are already 2-dp and may be negative; prefix only. */
function moneyStr(s: string): string {
  return `$${s}`;
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
