package uz.malika.erp.features.finance.data

import kotlinx.serialization.json.JsonElement
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * Retrofit endpoints this slice needs. Writes return [JsonElement] (created
 * body, so a non-2xx raises `HttpException` for `runApi`) except delete, which
 * is a 204 and returns a [Response] the repository inspects.
 *
 * NB: the foundation `ApiService` is fixed and carries only auth+sync routes,
 * so this feature declares its own interface (see [FinanceHttp]).
 */
interface FinanceApi {

    @GET("expenses")
    suspend fun expenses(
        @Query("categoryId") categoryId: String?,
        @Query("isRecurring") isRecurring: Boolean?,
        @Query("page") page: Int,
        @Query("pageSize") pageSize: Int,
    ): ExpensePage

    @GET("expenses/summary")
    suspend fun expenseSummary(
        @Query("from") from: String?,
        @Query("to") to: String?,
    ): ExpenseSummary

    @POST("expenses")
    suspend fun createExpense(@Body body: CreateExpenseBody): JsonElement

    @DELETE("expenses/{id}")
    suspend fun deleteExpense(@Path("id") id: String): Response<Unit>

    @GET("expense-categories")
    suspend fun expenseCategories(): List<ExpenseCategory>

    @POST("expense-categories")
    suspend fun createCategory(@Body body: CreateCategoryBody): JsonElement

    @GET("reports/profit")
    suspend fun profit(@Query("from") from: String?, @Query("to") to: String?): ProfitReport

    @GET("reports/expenses")
    suspend fun expenseReport(
        @Query("from") from: String?,
        @Query("to") to: String?,
        @Query("groupBy") groupBy: String,
    ): List<ExpenseReportRow>

    @GET("reports/model-pricing")
    suspend fun modelPricing(@Query("windowDays") windowDays: Int): List<ModelPricingRow>

    @GET("reports/daily-closing")
    suspend fun dailyClosing(@Query("date") date: String?): DailyClosingReport

    @GET("device-models")
    suspend fun deviceModels(): List<DeviceModelRef>

    @GET("stock-alert-rules/low-stock")
    suspend fun lowStock(): List<LowStockItem>

    @GET("consignments/overdue")
    suspend fun overdue(): List<OverdueConsignment>
}
