package uz.malika.erp.features.sales.data

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import uz.malika.erp.core.AppException
import uz.malika.erp.core.runApi
import uz.malika.erp.data.local.AppDatabase
import uz.malika.erp.data.sync.OutboxApi
import uz.malika.erp.data.sync.OutboxType

/**
 * POS data access: resolve a device by IMEI (local cache first, then the server),
 * enqueue a checkout to the outbox (offline-capable), and expose settings +
 * pending-sold IMEIs. Checkout NEVER posts directly — it always goes through the
 * outbox so a sale survives a dropped connection; the push drain delivers it.
 */
class PosRepository(
    private val api: SalesApi,
    private val db: AppDatabase,
    private val outbox: OutboxApi,
    private val json: Json,
) {
    /** Cached row first (offline), then `/devices/by-imei/:imei`; null when neither has it. */
    suspend fun lookup(imei: String, online: Boolean): ScannedDevice? {
        db.deviceDao().findByImei(imei)?.let { return ScannedDevice.fromCache(it) }
        if (!online) return null
        return runApi {
            try {
                ScannedDevice.fromDto(api.deviceByImei(imei))
            } catch (e: AppException) {
                if (e.statusCode == 404) null else throw e
            }
        }
    }

    /**
     * Resolve any scanned/typed code to a unit or a quantity product (ADR 0030).
     * Offline: the device cache (imei/serial) then the product cache (barcode) —
     * units win. Online: `GET /scan/:code`, which applies the same precedence.
     */
    suspend fun scan(code: String, online: Boolean): ScanOutcome {
        db.deviceDao().findByImei(code)?.let { return ScanOutcome.Unit(ScannedDevice.fromCache(it)) }
        db.productDao().findByBarcode(code)?.let { return ScanOutcome.Product(CartProduct.fromCache(it)) }
        if (!online) return ScanOutcome.NotFound
        return runApi {
            try {
                val res = api.scan(code)
                when {
                    res.unit != null -> ScanOutcome.Unit(ScannedDevice.fromDto(res.unit))
                    res.product != null -> ScanOutcome.Product(CartProduct.fromDto(res.product))
                    else -> ScanOutcome.NotFound
                }
            } catch (e: AppException) {
                if (e.statusCode == 404) ScanOutcome.NotFound else throw e
            }
        }
    }

    /** Find quantity products by name/barcode (the till's typed search). Online hits
     *  `GET /stock?search=`; offline filters the product cache by name/barcode. */
    suspend fun searchProducts(query: String, online: Boolean): List<CartProduct> {
        val q = query.trim()
        if (q.isEmpty()) return emptyList()
        if (online) return runApi { api.stockSearch(mapOf("search" to q)).map(CartProduct::fromDto) }
        return db.productDao().search(q).map(CartProduct::fromCache)
    }

    /** Unit codes with a pending offline `sale.create` — treated as already sold on re-scan. */
    fun watchPendingSoldImeis(): Flow<Set<String>> =
        db.outboxDao().watchAll().map { rows ->
            rows.asSequence()
                .filter { it.type == OutboxType.SALE_CREATE && it.status == "pending" }
                .mapNotNull { codeOf(it.payload) }
                .toSet()
        }

    /** Whichever identifier the queued sale carries — imei or serialNumber (ADR 0029). */
    private fun codeOf(payloadJson: String): String? =
        runCatching {
            val obj = json.parseToJsonElement(payloadJson).jsonObject
            (obj["imei"] ?: obj["serialNumber"])?.jsonPrimitive?.content
        }.getOrNull()?.takeIf { it.isNotEmpty() }

    /** Queue the checkout. Returns the mutation id (= clientMutationId the server dedups on). */
    suspend fun enqueueSale(payload: kotlinx.serialization.json.JsonObject, baseVersion: Int?): String =
        outbox.enqueue(OutboxType.SALE_CREATE, payload, baseVersion)

    /**
     * Post one sale directly online (ADR 0039 trade-in path): the server refuses
     * trade-ins on the sync replay, so a cart with a trade-in is never queued.
     * Returns the created sale id.
     */
    suspend fun createSaleDirect(payload: kotlinx.serialization.json.JsonObject): String =
        runApi { api.createSale(payload).id }

    suspend fun defaultWarrantyDays(): Int = runApi { api.settings().defaultWarrantyDays }

    /** The chosen customer's bonus balance + max redeem share (`GET /customers/:id/bonus`). */
    suspend fun customerBonus(customerId: String): uz.malika.erp.features.sales.data.CustomerBonusDto = runApi {
        api.customerBonus(customerId)
    }

    /**
     * Till settings (ADR 0034/0035/0036). Online: fetch `GET /settings` and cache
     * the payload in `sync_meta` so an offline till still knows the discount rules,
     * whether credit is on, and whether shifts are on; offline: read that cache.
     * Default (nothing cached, call fails): discounts off, credit off, shifts off.
     */
    suspend fun tillSettings(online: Boolean): TillSettings {
        if (online) {
            val dto = runCatching { api.settings() }.getOrNull()
            if (dto != null) {
                runCatching {
                    db.syncMetaDao().set(
                        uz.malika.erp.data.local.SyncMetaEntity(DISCOUNT_SETTINGS_KEY, json.encodeToString(SettingsDto.serializer(), dto)),
                    )
                }
                return dto.toTillSettings()
            }
        }
        val cached = runCatching { db.syncMetaDao().get(DISCOUNT_SETTINGS_KEY) }.getOrNull()
        return cached?.let { runCatching { json.decodeFromString(SettingsDto.serializer(), it).toTillSettings() }.getOrNull() }
            ?: TillSettings()
    }

    private companion object {
        const val DISCOUNT_SETTINGS_KEY = "pos_discount_settings"
    }
}

/** The till settings bundle: discount rules + the credit and shift switches. */
private fun SettingsDto.toTillSettings() = TillSettings(
    discount = toDiscountSettings(),
    creditEnabled = customerCreditEnabled,
    shiftsEnabled = shiftsEnabled,
    bonusEnabled = bonusEnabled,
    receiptPrintingEnabled = receiptPrintingEnabled,
    receiptPaperWidthMm = receiptPaperWidthMm,
    priceTagsEnabled = priceTagsEnabled,
    storeName = storeName,
    storeAddress = storeAddress,
    storePhone = storePhone,
    receiptFooter = receiptFooter,
)

/** Map the settings payload into the till's discount rules (ADR 0034). */
private fun SettingsDto.toDiscountSettings() = uz.malika.erp.features.sales.lib.DiscountSettings(
    enabled = discountsEnabled,
    percentAllowed = discountPercentAllowed,
    amountAllowed = discountAmountAllowed,
    maxPercent = uz.malika.erp.shared.lib.parseMoney(maxDiscountPercent),
    presetsPercent = discountPresetsPercent.map { java.math.BigDecimal.valueOf(it) },
    presetsAmount = discountPresetsAmount.map { java.math.BigDecimal.valueOf(it) },
)
