package uz.malika.erp.shared.payments

import uz.malika.erp.core.runApi

/**
 * Account options for every money picker. With `balance.read` they come from
 * `GET /ledger/balances`; without it (cashiers) the two known codes CASH/CARD.
 * The only place this talks to the endpoint.
 */
class AccountsRepository(private val api: AccountsApi) {

    suspend fun options(canReadBalance: Boolean): List<AccountOption> {
        if (!canReadBalance) return AccountOption.FALLBACK
        return runApi {
            api.balances().accounts
                .map { AccountOption(it.accountCode, it.label) }
                .ifEmpty { AccountOption.FALLBACK }
                .canonicalOrder()
        }
    }
}
