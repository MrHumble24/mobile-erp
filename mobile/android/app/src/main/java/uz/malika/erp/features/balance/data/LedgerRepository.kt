package uz.malika.erp.features.balance.data

import uz.malika.erp.core.runApi
import uz.malika.erp.shared.lib.DEFAULT_PAGE_SIZE

/**
 * The only place this slice talks to `/ledger`. All writes are online-only (no
 * outbox — ledger entries are never queued); callers gate on connectivity first.
 * Failures surface as a normalized `AppException` via `runApi`.
 */
class LedgerRepository(private val api: LedgerApi) {

    suspend fun balances(): LedgerBalances = runApi { api.balances() }

    suspend fun transactions(filter: LedgerFilter, page: Int): LedgerTxnPage = runApi {
        api.transactions(
            accountCode = filter.accountCode,
            typeCode = filter.typeCode,
            from = filter.fromIso,
            to = filter.toIso,
            page = page,
            pageSize = DEFAULT_PAGE_SIZE,
        )
    }

    suspend fun create(body: CreateLedgerTxnBody) = runApi {
        api.createTransaction(body)
        Unit
    }

    suspend fun transfer(body: CreateTransferBody) = runApi {
        api.createTransfer(body)
        Unit
    }
}
