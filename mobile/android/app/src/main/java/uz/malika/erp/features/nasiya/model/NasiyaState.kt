package uz.malika.erp.features.nasiya.model

import uz.malika.erp.features.nasiya.data.AgingBucketDto
import uz.malika.erp.features.nasiya.data.ConsignmentStatsDto
import uz.malika.erp.features.nasiya.data.ConsignmentViewDto
import uz.malika.erp.features.nasiya.data.LedgerEntryDto
import uz.malika.erp.shared.lib.PageState

/**
 * One-shot write outcome for the partner/consignment action sheets. [offline]
 * marks an online-only write blocked for want of a connection; [queuedOffline]
 * marks an offline-capable consignment write parked in the outbox (pending sync).
 */
data class ActionState(
    val submitting: Boolean = false,
    val error: String? = null,
    val offline: Boolean = false,
    val done: Boolean = false,
    val queuedOffline: Boolean = false,
)

/** Partner ledger + aging load (both online, not in the changes feed). */
data class LedgerState(
    val loading: Boolean = true,
    val error: String? = null,
    val entries: List<LedgerEntryDto> = emptyList(),
    val aging: List<AgingBucketDto> = emptyList(),
)

/** Consignments list (paginated) + summary tiles for the active tab/search/range. */
data class ConsignmentsState(
    val loading: Boolean = true,
    val error: String? = null,
    val page: PageState<ConsignmentViewDto> = PageState(),
    val stats: ConsignmentStatsDto? = null,
)
