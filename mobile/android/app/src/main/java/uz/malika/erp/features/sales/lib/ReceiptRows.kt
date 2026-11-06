package uz.malika.erp.features.sales.lib

import uz.malika.erp.features.sales.data.ReceiptData
import uz.malika.erp.i18n.Translate
import uz.malika.erp.shared.lib.formatPoints
import uz.malika.erp.shared.lib.parseMoney

/**
 * The receipt header lines shared by the on-screen paper and the printed
 * receipt (ADR 0043): shop name, address, phone, skipping blank ones.
 */
fun receiptHeaderLines(data: ReceiptData): List<String> = listOfNotNull(
    data.storeName?.takeIf { it.isNotBlank() },
    data.storeAddress?.takeIf { it.isNotBlank() },
    data.storePhone?.takeIf { it.isNotBlank() },
)

/**
 * The receipt's points lines, in order: points spent (negative), then points
 * earned — each only when above zero, so a sale without points is unchanged.
 */
fun receiptBonusRows(spent: String?, earned: String?, t: Translate): List<PrintRow> {
    val rows = mutableListOf<PrintRow>()
    if (parseMoney(spent).signum() > 0) {
        rows += PrintRow(t("sales.paidWithPoints", null), "-" + formatPoints(spent))
    }
    if (parseMoney(earned).signum() > 0) {
        rows += PrintRow(t("sales.pointsEarned", null), formatPoints(earned))
    }
    return rows
}
