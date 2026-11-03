package uz.malika.erp.features.finance.data

import uz.malika.erp.core.AppException
import uz.malika.erp.core.runApi

/**
 * Read-only report + dashboard sources (low-stock, overdue, device
 * models) for the reports and dashboard screens. All online reads; each
 * endpoint is permission-gated server-side and surfaced only when the UI
 * `can()` it. [deviceModelLabels] tolerates a 403 (user may not read models)
 * by returning an empty map so pricing rows fall back to the raw id.
 */
class FinanceReads(private val api: FinanceApi) {

    suspend fun profit(from: String?, to: String?): ProfitReport = runApi { api.profit(from, to) }

    suspend fun trend(from: String?, to: String?, bucket: String): List<TrendPoint> =
        runApi { api.trend(from, to, bucket) }

    suspend fun profitBreakdown(from: String?, to: String?, groupBy: String): List<BreakdownRow> =
        runApi { api.profitBreakdown(from, to, groupBy) }

    suspend fun returns(from: String?, to: String?, page: Int, pageSize: Int): ReturnsPage =
        runApi { api.returns(from, to, page, pageSize) }

    suspend fun consignmentsReport(from: String?, to: String?): ConsignmentsReport =
        runApi { api.consignmentsReport(from, to) }

    suspend fun inventoryReport(): InventoryReport = runApi { api.inventoryReport() }

    suspend fun expenseReport(from: String?, to: String?, groupBy: String): List<ExpenseReportRow> =
        runApi { api.expenseReport(from, to, groupBy) }

    suspend fun modelPricing(windowDays: Int = 90): List<ModelPricingRow> =
        runApi { api.modelPricing(windowDays) }

    suspend fun dailyClosing(date: String?): DailyClosingReport = runApi { api.dailyClosing(date) }

    suspend fun lowStock(): List<LowStockItem> = runApi { api.lowStock() }

    suspend fun overdue(): List<OverdueConsignment> = runApi { api.overdue() }

    suspend fun deviceModelLabels(): Map<String, String> =
        try {
            api.deviceModels().associate { it.id to it.label.ifBlank { it.id } }
        } catch (_: Exception) {
            emptyMap()
        }
}
