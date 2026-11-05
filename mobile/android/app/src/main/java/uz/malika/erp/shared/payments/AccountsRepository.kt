package uz.malika.erp.shared.payments

import uz.malika.erp.core.runApi

/**
 * Account options for every money picker, from `GET /ledger/accounts` (any
 * signed-in user). The only place this talks to the endpoint; CASH/CARD is the
 * fallback when the list is empty or the call fails.
 */
class AccountsRepository(private val api: AccountsApi) {

    suspend fun options(): List<AccountOption> = runApi {
        api.accounts()
            .map { AccountOption(it.accountCode, it.label) }
            .ifEmpty { AccountOption.FALLBACK }
            .canonicalOrder()
    }
}
