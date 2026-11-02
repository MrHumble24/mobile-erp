package uz.malika.erp.features.finance.data

import kotlinx.serialization.json.JsonElement
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * Retrofit endpoints this slice needs. Writes return [JsonElement] (created
 * body, so a non-2xx raises `HttpException` for `runApi`) except delete, which
 * is a 204 and returns a [Response] the repository inspects.
 *
 * NB: the foundation `ApiService` carries only auth+sync routes, so this
 * feature declares its own interface, built via
 * `container.retrofit.create(FinanceApi::class.java)` (the one shared pipeline).
 */
interface FinanceApi {

    @Suppress("LongParameterList")
    @GET("expenses")
    suspend fun expenses(
        @Query("categoryId") categoryId: String?,
        @Query("isRecurring") isRecurring: Boolean?,
        @Query("search") search: String?,
        @Query("minAmount") minAmount: Double?,
        @Query("maxAmount") maxAmount: Double?,
        @Query("from") from: String?,
        @Query("to") to: String?,
        @Query("sort") sort: String,
        @Query("dir") dir: String,
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

    @PATCH("expenses/{id}")
    suspend fun updateExpense(@Path("id") id: String, @Body body: CreateExpenseBody): JsonElement

    @DELETE("expenses/{id}")
    suspend fun deleteExpense(@Path("id") id: String): Response<Unit>

    @GET("expense-categories")
    suspend fun expenseCategories(): List<ExpenseCategory>

    @POST("expense-categories")
    suspend fun createCategory(@Body body: CreateCategoryBody): JsonElement

    @PATCH("expense-categories/{id}")
    suspend fun updateCategory(@Path("id") id: String, @Body body: UpdateCategoryBody): JsonElement

    @GET("expense-recurrences")
    suspend fun recurrences(): List<ExpenseRecurrence>

    @POST("expense-recurrences")
    suspend fun createRecurrence(@Body body: CreateRecurrenceBody): JsonElement

    @PATCH("expense-recurrences/{id}")
    suspend fun updateRecurrence(@Path("id") id: String, @Body body: UpdateRecurrenceBody): JsonElement

    @POST("expense-recurrences/generate")
    suspend fun generateRecurrences(): GenerateResult

    @GET("reports/profit")
    suspend fun profit(@Query("from") from: String?, @Query("to") to: String?): ProfitReport

    @GET("reports/trend")
    suspend fun trend(
        @Query("from") from: String?,
        @Query("to") to: String?,
        @Query("bucket") bucket: String,
    ): List<TrendPoint>

    @GET("reports/profit/breakdown")
    suspend fun profitBreakdown(
        @Query("from") from: String?,
        @Query("to") to: String?,
        @Query("groupBy") groupBy: String,
    ): List<BreakdownRow>

    @GET("reports/consignments")
    suspend fun consignmentsReport(
        @Query("from") from: String?,
        @Query("to") to: String?,
    ): ConsignmentsReport

    @GET("reports/inventory")
    suspend fun inventoryReport(): InventoryReport

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
