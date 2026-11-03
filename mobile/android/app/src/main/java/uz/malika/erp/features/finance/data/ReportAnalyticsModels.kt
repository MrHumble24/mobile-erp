package uz.malika.erp.features.finance.data

import kotlinx.serialization.Serializable

/**
 * Analytics report shapes for `/reports/{trend,profit/breakdown,consignments,
 * inventory}` — the sources behind the Overview / Sales / Nasiya / Inventory
 * report tabs and their breakdown drill-downs. Money fields arrive as JSON
 * numbers (computed aggregates) and are read as decimal strings via
 * [FlexMoneySerializer]; `share` is a 0..1 fraction.
 */
@Serializable
data class TrendPoint(
    val bucket: String = "",
    @Serializable(with = FlexMoneySerializer::class) val revenue: String = "0",
    @Serializable(with = FlexMoneySerializer::class) val cogs: String = "0",
    @Serializable(with = FlexMoneySerializer::class) val grossProfit: String = "0",
    @Serializable(with = FlexMoneySerializer::class) val expenses: String = "0",
    val unitsSold: Int = 0,
    @Serializable(with = FlexMoneySerializer::class) val returnsRefunded: String = "0",
)

@Serializable
data class BreakdownRow(
    val key: String = "",
    val label: String = "",
    @Serializable(with = FlexMoneySerializer::class) val revenue: String = "0",
    @Serializable(with = FlexMoneySerializer::class) val cogs: String = "0",
    @Serializable(with = FlexMoneySerializer::class) val grossProfit: String = "0",
    val unitsSold: Int = 0,
    val share: Double = 0.0,
)

@Serializable
data class ConsignmentPartnerRow(
    val partnerId: String = "",
    val shopName: String = "",
    @Serializable(with = FlexMoneySerializer::class) val outstanding: String = "0",
    val openCount: Int = 0,
    val overdueCount: Int = 0,
    @Serializable(with = FlexMoneySerializer::class) val settledRevenue: String = "0",
)

@Serializable
data class ConsignmentsReport(
    val createdCount: Int = 0,
    val settledCount: Int = 0,
    val returnedCount: Int = 0,
    @Serializable(with = FlexMoneySerializer::class) val settledRevenue: String = "0",
    @Serializable(with = FlexMoneySerializer::class) val outstandingTotal: String = "0",
    val overdueCount: Int = 0,
    val byPartner: List<ConsignmentPartnerRow> = emptyList(),
)

/** One refunded return (`/reports/returns`). `refundAmount` is a JSON number. */
@Serializable
data class ReturnRow(
    val id: String = "",
    val saleId: String = "",
    val imei: String = "",
    val model: String = "",
    @Serializable(with = FlexMoneySerializer::class) val refundAmount: String = "0",
    val reason: String? = null,
    val returnedAt: String = "",
    val processedBy: String = "",
)

/** One page of [ReturnRow]s (`{ items, total, page, pageSize }`). */
@Serializable
data class ReturnsPage(
    val items: List<ReturnRow> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val pageSize: Int = 50,
)

@Serializable
data class InventoryStatusRow(val statusCode: String = "", val label: String = "", val count: Int = 0)

@Serializable
data class InventoryModelRow(
    val modelId: String = "",
    val label: String = "",
    val units: Int = 0,
    @Serializable(with = FlexMoneySerializer::class) val landedValue: String = "0",
    val avgDaysInStock: Double = 0.0,
)

@Serializable
data class InventoryAgingRow(
    val bucket: String = "",
    val units: Int = 0,
    @Serializable(with = FlexMoneySerializer::class) val landedValue: String = "0",
)

@Serializable
data class InventoryReport(
    val inStockUnits: Int = 0,
    @Serializable(with = FlexMoneySerializer::class) val inStockLandedValue: String = "0",
    val defectiveUnits: Int = 0,
    val consignedUnits: Int = 0,
    val byStatus: List<InventoryStatusRow> = emptyList(),
    val byModel: List<InventoryModelRow> = emptyList(),
    val aging: List<InventoryAgingRow> = emptyList(),
)
