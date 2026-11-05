package uz.malika.erp.features.shifts.data

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.QueryMap

/** The one Retrofit door for cashier shifts (ADR 0036). All paths under `/shifts`. */
interface ShiftApi {

    /** My open shift with live figures, or 204/null when none. */
    @GET("shifts/current")
    suspend fun current(): ShiftReportView?

    @POST("shifts/open")
    suspend fun open(@Body body: OpenShiftBody): ShiftReportView

    @POST("shifts/close")
    suspend fun close(@Body body: CloseShiftBody): ShiftReportView

    @GET("shifts")
    suspend fun list(@QueryMap query: Map<String, String>): ShiftListResult

    @GET("shifts/{id}/report")
    suspend fun report(@Path("id") id: String): ShiftReportView

    @POST("shifts/{id}/force-close")
    suspend fun forceClose(@Path("id") id: String, @Body body: ForceCloseShiftBody): ShiftReportView
}
