package uz.malika.erp.features.inventory.data

/** A stock-alert rule: cap a (model, storage) pair at a minimum threshold. */
data class StockAlertRuleView(
    val id: String,
    val modelId: String,
    val storage: String,
    val threshold: Int,
) {
    companion object {
        fun fromDto(d: StockAlertRuleDto) =
            StockAlertRuleView(d.id, d.modelId, d.storage, d.threshold)
    }
}

/** A rule with its live in-stock count (below threshold = flagged). */
data class LowStockView(
    val id: String,
    val modelId: String,
    val storage: String,
    val threshold: Int,
    val currentCount: Int,
) {
    val isBelow: Boolean get() = currentCount < threshold

    companion object {
        fun fromDto(d: LowStockDto) =
            LowStockView(d.id, d.modelId, d.storage, d.threshold, d.currentCount)
    }
}
