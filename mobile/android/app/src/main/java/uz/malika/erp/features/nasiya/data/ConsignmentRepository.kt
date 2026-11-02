package uz.malika.erp.features.nasiya.data

import uz.malika.erp.core.runApi

/** Status tab for the consignments list. */
enum class ConsignmentTab { OUT, OVERDUE, SETTLED, RETURNED, ALL }

/**
 * Online reads for `/consignments/…` (the list is not in the `/sync/changes`
 * feed). The three writes are offline-capable and live in [ConsignmentWriter].
 */
class ConsignmentRepository(private val api: NasiyaApi) {

    /** Max page size the server allows; the mobile list is single-page. */
    private val pageSize = 200

    suspend fun list(tab: ConsignmentTab, search: String?): List<ConsignmentViewDto> = runApi {
        if (tab == ConsignmentTab.OVERDUE) return@runApi api.overdue()
        api.listConsignments(listParams(tab, search)).items
    }

    suspend fun stats(tab: ConsignmentTab, search: String?): ConsignmentStatsDto =
        runApi { api.stats(listParams(tab, search)) }

    private fun listParams(tab: ConsignmentTab, search: String?): Map<String, String> =
        buildMap {
            put("pageSize", pageSize.toString())
            when (tab) {
                ConsignmentTab.OUT -> put("statusCode", "OUT")
                ConsignmentTab.SETTLED -> put("statusCode", "SETTLED")
                ConsignmentTab.RETURNED -> put("statusCode", "RETURNED")
                ConsignmentTab.OVERDUE -> put("overdue", "true")
                ConsignmentTab.ALL -> {}
            }
            search?.trim()?.takeIf { it.isNotEmpty() }?.let { put("search", it) }
        }
}
