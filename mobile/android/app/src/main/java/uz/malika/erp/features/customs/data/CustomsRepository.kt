package uz.malika.erp.features.customs.data

import uz.malika.erp.core.runApi

/**
 * The only place the customs slice talks HTTP. Each call wraps [runApi] so
 * failures surface as a normalized `AppException`. Reads need `customs.read`,
 * the create needs `customs.manage` — both enforced server-side.
 */
class CustomsRepository(private val api: CustomsApi) {
    suspend fun current(): CurrentListDto? = runApi { api.current() }
    suspend fun versions(): List<PriceListVersionDto> = runApi { api.versions() }
    suspend fun unmatchedModels(): List<UnmatchedModelDto> = runApi { api.unmatchedModels() }
    suspend fun feeHistory(customsCode: String): List<FeeHistoryPointDto> =
        runApi { api.feeHistory(customsCode) }
    suspend fun createPriceList(body: CreatePriceListBody): PriceListVersionDto =
        runApi { api.createPriceList(body) }
}
