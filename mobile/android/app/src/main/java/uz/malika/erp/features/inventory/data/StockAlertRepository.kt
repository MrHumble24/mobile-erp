package uz.malika.erp.features.inventory.data

import uz.malika.erp.core.runApi

/** The only place that talks to `/stock-alert-rules`. Writes need `settings.manage`. */
class StockAlertRepository(private val api: InventoryApi) {

    suspend fun lowStock(): List<LowStockView> =
        runApi { api.lowStock().map(LowStockView::fromDto) }

    suspend fun list(): List<StockAlertRuleView> =
        runApi { api.rules().map(StockAlertRuleView::fromDto) }

    suspend fun create(modelId: String, storage: String, threshold: Int) =
        runApi { api.createRule(CreateRuleBody(modelId, storage, threshold)) }

    suspend fun update(id: String, storage: String, threshold: Int) =
        runApi { api.updateRule(id, UpdateRuleBody(storage, threshold)) }
}
