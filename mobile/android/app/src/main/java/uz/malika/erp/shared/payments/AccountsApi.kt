package uz.malika.erp.shared.payments

import kotlinx.serialization.Serializable
import retrofit2.http.GET

/**
 * The accounts half of `GET /ledger/balances` — just the codes + labels the
 * pickers need (balances/totals are the balance slice's concern). Its own
 * Retrofit interface, built via `container.retrofit.create(...)` on the one
 * shared pipeline. Requires `balance.read`; cashiers use [AccountOption.FALLBACK].
 */
interface AccountsApi {
    @GET("ledger/balances")
    suspend fun balances(): BalancesResponse
}

@Serializable
data class BalancesResponse(val accounts: List<AccountRefDto> = emptyList())

@Serializable
data class AccountRefDto(val accountCode: String = "", val label: String = "")
