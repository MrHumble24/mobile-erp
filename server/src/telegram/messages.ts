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

export interface DigestStoreBlock {
  storeName: string;
  unitsSold: number;
  revenue: number;
  netProfit: number;
  expenses: number;
  balances: {
    accounts: DigestBalanceLine[];
    openingTotal: string;
    closingTotal: string;
  };
}

function formatStoreBlock(s: DigestStoreBlock): string {
  const bLines = [
    ...s.balances.accounts.map(
      (a) => `  ${a.label}: ${moneyStr(a.opening)} -> ${moneyStr(a.closing)}`,
    ),
    `  Total: ${moneyStr(s.balances.openingTotal)} -> ${moneyStr(s.balances.closingTotal)}`,
  ];
  return (
    `🏪 ${s.storeName}:\n` +
    `  Sotilgan: ${s.unitsSold} ta\n` +
    `  Tushum: ${money(s.revenue)}\n` +
    `  Sof foyda: ${money(s.netProfit)}\n` +
    `  Xarajatlar: ${money(s.expenses)}\n` +
    `  Balans:\n${bLines.join('\n')}`
  );
}

export function dailyDigest(p: {
  date: string;
  unitsSold?: number;
  revenue?: number;
  netProfit?: number;
  expenses?: number;
  outstanding: number;
  balances?: {
    accounts: DigestBalanceLine[];
    openingTotal: string;
    closingTotal: string;
  };
  stores?: DigestStoreBlock[];
}): string {
  if (p.stores && p.stores.length > 0) {
    const storeBlocks = p.stores.map(formatStoreBlock);
    return (
      `📊 Kunlik yakuniy hisobot (${p.date}):\n\n` +
      storeBlocks.join('\n\n') +
      `\n\n🤝 Nasiyadagi qoldiq: ${money(p.outstanding)}`
    );
  }

  const balanceLines = [
    ...(p.balances?.accounts ?? []).map(
      (a) => `${a.label}: ${moneyStr(a.opening)} -> ${moneyStr(a.closing)}`,
    ),
    `Total: ${moneyStr(p.balances?.openingTotal ?? '0.00')} -> ${moneyStr(p.balances?.closingTotal ?? '0.00')}`,
  ];
  return (
    `📊 Kunlik yakuniy hisobot (${p.date}):\n` +
    `Sotilgan tovarlar: ${p.unitsSold ?? 0} ta\n` +
    `Tushum: ${money(p.revenue ?? 0)}\n` +
    `Sof foyda: ${money(p.netProfit ?? 0)}\n` +
    `Xarajatlar: ${money(p.expenses ?? 0)}\n` +
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
