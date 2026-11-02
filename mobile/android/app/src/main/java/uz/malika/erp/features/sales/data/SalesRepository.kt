package uz.malika.erp.features.sales.data

import kotlinx.serialization.json.Json
import uz.malika.erp.core.runApi
import uz.malika.erp.data.local.AppDatabase
import uz.malika.erp.features.sales.lib.remainingWarrantyDays

/** Server filters for the sales list. Empty values are dropped from the query. */
data class SaleFilters(
    val from: String? = null,
    val to: String? = null,
    val channel: SaleChannel? = null,
    val search: String? = null,
) {
    fun toQuery(): Map<String, String> = buildMap {
        from?.let { put("from", it) }
        to?.let { put("to", it) }
        channel?.let { put("channel", if (it == SaleChannel.B2B) "b2b" else "retail") }
        search?.takeIf { it.isNotBlank() }?.let { put("search", it) }
    }
}

data class SalesPage(val items: List<Sale>, val total: Int)

/**
 * Reads the sales endpoints and performs the (online-only) return. The only HTTP
 * door for sales. Also serves the OFFLINE warranty lookup from the device cache so
 * a cashier can check cover without a connection.
 */
class SalesRepository(
    private val api: SalesApi,
    private val db: AppDatabase,
    private val json: Json,
) {
    suspend fun list(filters: SaleFilters): SalesPage = runApi {
        val dto = api.sales(filters.toQuery())
        SalesPage(items = dto.items.map { it.toDomain() }, total = dto.total)
    }

    suspend fun warrantyOnline(imei: String): Warranty = runApi { api.warranty(imei).toDomain() }

    /** Offline fallback: build warranty status from the cached device + latest sale. */
    suspend fun warrantyFromCache(imei: String): Warranty? {
        val device = db.deviceDao().findByImei(imei) ?: return null
        val saleJson = device.latestSale ?: return null
        val sale = runCatching { json.decodeFromString(CachedSaleDto.serializer(), saleJson) }
            .getOrNull() ?: return null
        val endsMillis = uz.malika.erp.features.sales.lib.parseIsoMillis(sale.warrantyEndsAt)
        val remaining = endsMillis?.let { remainingWarrantyDays(it, System.currentTimeMillis()) } ?: 0
        return Warranty(
            imei = device.imei,
            saleId = sale.id,
            salePrice = sale.salePrice,
            remainingDays = remaining,
            hasWarranty = sale.warrantyEndsAt != null,
            grade = device.gradeCode,
            notes = device.inspectionNotes,
            alreadyReturned = false, // unknown offline; server is authoritative
        )
    }

    suspend fun receipt(saleId: String): ReceiptData = runApi { api.receipt(saleId).toReceiptData() }

    suspend fun processReturn(
        saleId: String,
        refundAmount: Double,
        deviceToStatusCode: String,
        reason: String?,
    ): Unit = runApi {
        api.returnSale(
            saleId,
            ReturnBody(
                refundAmount = refundAmount,
                deviceToStatusCode = deviceToStatusCode,
                reason = reason?.takeIf { it.isNotBlank() },
            ),
        )
    }
}
