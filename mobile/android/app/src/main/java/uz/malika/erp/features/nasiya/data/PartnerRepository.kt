package uz.malika.erp.features.nasiya.data

import uz.malika.erp.core.runApi

/**
 * The only place that calls `/partners/…`. The partner directory itself is read
 * from the local mirror (hydrated by `/sync/changes`); this handles the ledger
 * + aging (not in the changes feed) and the online-only writes. All four writes
 * have no offline handler, so callers gate on connectivity first.
 */
class PartnerRepository(private val api: NasiyaApi) {

    suspend fun get(partnerId: String): PartnerDetailDto =
        runApi { api.partner(partnerId) }

    suspend fun ledger(partnerId: String): List<LedgerEntryDto> =
        runApi { api.ledger(partnerId) }

    suspend fun aging(partnerId: String): List<AgingBucketDto> =
        runApi { api.aging(partnerId) }

    suspend fun create(body: CreatePartnerBody) =
        runApi { api.createPartner(body) }

    suspend fun update(id: String, body: UpdatePartnerBody) =
        runApi { api.updatePartner(id, body) }

    suspend fun recordPayment(partnerId: String, body: RecordPaymentBody) =
        runApi { api.recordPayment(partnerId, body) }
}
