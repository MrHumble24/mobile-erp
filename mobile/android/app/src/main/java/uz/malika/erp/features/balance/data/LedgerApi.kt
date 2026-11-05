package uz.malika.erp.features.balance.data

import kotlinx.serialization.json.JsonElement
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

/**
 * The `/ledger` endpoints (JWT required). Writes return [JsonElement] (the
 * created body, so a non-2xx raises `HttpException` for `runApi`). Declared as
 * its own Retrofit interface, built via `container.retrofit.create(...)` — the
 * one shared OkHttp/Retrofit pipeline, never a second client.
 */
interface LedgerApi {

    @GET("ledger/balances")
    suspend fun balances(): LedgerBalances

    @GET("ledger/transactions")
    suspend fun transactions(
        @Query("accountCode") accountCode: String?,
        @Query("typeCode") typeCode: String?,
        @Query("from") from: String?,
        @Query("to") to: String?,
        @Query("page") page: Int,
        @Query("pageSize") pageSize: Int,
    ): LedgerTxnPage

    @POST("ledger/transactions")
    suspend fun createTransaction(@Body body: CreateLedgerTxnBody): JsonElement

    @POST("ledger/transfers")
    suspend fun createTransfer(@Body body: CreateTransferBody): JsonElement
}
