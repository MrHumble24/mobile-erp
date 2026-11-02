import type { ReceiptView } from "../model/sale.types"

export function formatReceiptText(receipt: ReceiptView, t: (key: string) => string): string {
  const dateStr = new Date(receipt.soldAt).toLocaleString()
  const warrantyStr = receipt.warranty
    ? `\n🛡 ${t("pos.officialWarranty")}: ${receipt.warranty.days} kun (${new Date(receipt.warranty.endsAt).toLocaleDateString()} gacha)`
    : ""
  const customerStr = receipt.customer
    ? `\n👤 ${t("pos.customer")}: ${receipt.customer.name}${receipt.customer.phone ? ` (${receipt.customer.phone})` : ""}`
    : ""

  const itemsStr = receipt.items
    .map(
      (item) =>
        `📱 ${item.model} ${[item.storage, item.color].filter(Boolean).join(" · ")}\n   IMEI: ${item.imei}\n   Narxi: $${Number(item.price).toLocaleString()}`
    )
    .join("\n")

  return `🧾 ${t("pos.storeName")} · ${t("pos.receiptTitle")}
━━━━━━━━━━━━━━━━━━━━━━━━━
${t("pos.receiptNumber")}: #${receipt.saleId.slice(0, 8).toUpperCase()}
${t("pos.soldAt")}: ${dateStr}
${t("pos.cashier")}: ${receipt.cashier}${customerStr}
─────────────────────────
${itemsStr}
─────────────────────────
💵 ${t("pos.totalDue")}: $${Number(receipt.total).toLocaleString()}${warrantyStr}
━━━━━━━━━━━━━━━━━━━━━━━━━
${t("pos.thankYou")}
${t("pos.storeLocation")}`
}

