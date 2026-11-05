package uz.malika.erp.features.stock.data

import uz.malika.erp.core.runApi

/** The only place the stock slice talks HTTP. Each call wraps [runApi]. */
class StockRepository(private val api: StockApi) {

    suspend fun list(categoryId: String?, search: String?): List<StockLevel> = runApi {
        val query = buildMap {
            categoryId?.let { put("categoryId", it) }
            search?.trim()?.takeIf { it.isNotEmpty() }?.let { put("search", it) }
        }
        api.stock(query).map(StockLevel::fromDto)
    }

    suspend fun movements(modelId: String, page: Int, pageSize: Int): StockMovementsPageDto = runApi {
        api.movements(modelId, page, pageSize)
    }

    /** Write-off or count correction (ADR 0030) → the product's new stock level. */
    suspend fun adjust(body: AdjustStockBody): StockLevel = runApi { StockLevel.fromDto(api.adjust(body)) }

    suspend fun categories(): List<StockCategory> = runApi { api.categories().map(StockCategory::fromDto) }
}
