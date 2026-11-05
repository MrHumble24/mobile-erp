package uz.malika.erp.shared.payments

import kotlinx.serialization.Serializable
import retrofit2.http.GET

/**
 * `GET /ledger/accounts` — the codes + labels every money picker needs. No
 * permission (cashiers pick cash/card at checkout without `balance.read`), so it
 * replaces the old `/ledger/balances` + CASH/CARD fallback. Its own Retrofit
 * interface, built via `container.retrofit.create(...)` on the one shared pipeline.
 */
interface AccountsApi {
    @GET("ledger/accounts")
    suspend fun accounts(): List<AccountRefDto>
}

@Serializable
data class AccountRefDto(val accountCode: String = "", val label: String = "")
