package uz.malika.erp.features.nasiya.data

import uz.malika.erp.core.runApi
import uz.malika.erp.shared.lib.DEFAULT_PAGE_SIZE

/** Status tab for the consignments list. */
enum class ConsignmentTab { OUT, OVERDUE, SETTLED, RETURNED, ALL }

/**
 * Online reads for `/consignments/…` (the list is not in the `/sync/changes`
 * feed). Every tab — overdue included — rides the one paginated `/consignments`
 * endpoint (overdue is a server filter), so one code path drives load-more. The
 * three writes are offline-capable and live in [ConsignmentWriter].
 */
class ConsignmentRepository(private val api: NasiyaApi) {

    suspend fun page(
        tab: ConsignmentTab,
        search: String?,
        from: String?,
        to: String?,
        page: Int = 1,
        pageSize: Int = DEFAULT_PAGE_SIZE,
    ): ConsignmentPageDto = runApi {
        api.listConsignments(listParams(tab, search, from, to, page, pageSize))
    }

    suspend fun stats(tab: ConsignmentTab, search: String?, from: String?, to: String?): ConsignmentStatsDto =
        runApi { api.stats(listParams(tab, search, from, to, null, null)) }

    suspend fun get(id: String): ConsignmentViewDto = runApi { api.consignment(id) }

    private fun listParams(
        tab: ConsignmentTab,
        search: String?,
        from: String?,
        to: String?,
        page: Int?,
        pageSize: Int?,
    ): Map<String, String> = buildMap {
        page?.let { put("page", it.toString()) }
        pageSize?.let { put("pageSize", it.toString()) }
        when (tab) {
            ConsignmentTab.OUT -> put("statusCode", "OUT")
            ConsignmentTab.SETTLED -> put("statusCode", "SETTLED")
            ConsignmentTab.RETURNED -> put("statusCode", "RETURNED")
            ConsignmentTab.OVERDUE -> put("overdue", "true")
            ConsignmentTab.ALL -> {}
        }
        search?.trim()?.takeIf { it.isNotEmpty() }?.let { put("search", it) }
        from?.let { put("from", it) }
        to?.let { put("to", it) }
    }
}
