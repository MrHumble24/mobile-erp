package uz.malika.erp.features.finance.data

import kotlinx.serialization.Serializable

/**
 * Report + dashboard read shapes. Money fields are decimal strings via
 * [FlexMoneySerializer]; cost fields are nullable (absent/redacted for users
 * without `device.cost.view`). Shared by the reports and dashboard screens
 * (one slice — no cross-slice duplication needed).
 */
@Serializable
data class ChannelSplit(
    @Serializable(with = FlexMoneySerializer::class) val retail: String = "0",
    @Serializable(with = FlexMoneySerializer::class) val b2b: String = "0",
)

@Serializable
data class ProfitReport(
    @Serializable(with = FlexMoneySerializer::class) val revenue: String = "0",
    @Serializable(with = FlexMoneySerializer::class) val cogs: String = "0",
    val unitsSold: Int = 0,
    @Serializable(with = FlexMoneySerializer::class) val grossProfit: String = "0",
    @Serializable(with = FlexMoneySerializer::class) val expenses: String = "0",
    @Serializable(with = FlexMoneySerializer::class) val netOperatingIncome: String = "0",
    val byChannel: ChannelSplit = ChannelSplit(),
    @Serializable(with = FlexMoneySerializer::class) val returnsRefunded: String = "0",
    /** Σ listPriceSnapshot − salePrice over snapshotted sales (ADR 0034). */
    @Serializable(with = FlexMoneySerializer::class) val discountsGiven: String = "0",
)

@Serializable
data class ExpenseReportRow(
    val key: String = "",
    val label: String = "",
    @Serializable(with = FlexMoneySerializer::class) val total: String = "0",
)

@Serializable
data class ModelPricingRow(
    val modelId: String,
    val storage: String? = null,
    @Serializable(with = FlexMoneySerializer::class) val avgAcquisitionCost: String? = null,
    @Serializable(with = FlexMoneySerializer::class) val avgSellingPrice: String? = null,
    val unitsInStock: Int = 0,
    val unitsSold: Int = 0,
)

@Serializable
data class DailyClosingReport(
    val date: String = "",
    val unitsSold: Int = 0,
    @Serializable(with = FlexMoneySerializer::class) val revenue: String = "0",
    @Serializable(with = FlexMoneySerializer::class) val grossProfit: String = "0",
    @Serializable(with = FlexMoneySerializer::class) val expenses: String = "0",
    val newConsignments: Int = 0,
    val settledConsignments: Int = 0,
)

/** Minimal device-model row, used only to label `modelId` in pricing rows. */
@Serializable
data class DeviceModelRef(
    val id: String,
    val brand: String = "",
    val name: String = "",
) {
    val label: String get() = "$brand $name".trim()
}

@Serializable
data class LowStockItem(
    val id: String,
    val modelId: String,
    val storage: String = "",
    val currentCount: Int = 0,
    val threshold: Int = 0,
)

@Serializable
data class OverdueConsignment(
    val id: String,
    val imei: String? = null,
    val serialNumber: String? = null,
    @Serializable(with = FlexMoneySerializer::class) val agreedPrice: String = "0",
    val dueDate: String = "",
    val partnerShopName: String = "",
    val partnerPhone: String? = null,
) {
    val code: String get() = imei ?: serialNumber ?: ""
}
