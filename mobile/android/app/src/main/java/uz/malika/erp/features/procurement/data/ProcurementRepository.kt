package uz.malika.erp.features.procurement.data

import uz.malika.erp.core.AppException
import uz.malika.erp.core.runApi

/**
 * The only place the procurement slice talks HTTP. Each call wraps [runApi] so
 * failures surface as a normalized `AppException`. Reads need `shipment.read` /
 * `qc.read` / `device.read`; writes need `shipment.manage`, `device.create`,
 * `qc.create` or `settings.manage` — all enforced server-side.
 */
class ProcurementRepository(private val api: ProcurementService) {

    // ── Suppliers ────────────────────────────────────────────────────────────
    suspend fun suppliers(): List<SupplierDto> = runApi { api.suppliers() }
    suspend fun createSupplier(body: SupplierBody) = runApi { api.createSupplier(body) }
    suspend fun updateSupplier(id: String, body: SupplierBody) = runApi { api.updateSupplier(id, body) }

    // ── Shipments + intake ────────────────────────────────────────────────────
    suspend fun shipments(): List<ShipmentDto> = runApi { api.shipments() }
    /** One shipment with its quantity purchase lines (ADR 0034). */
    suspend fun shipment(id: String): ShipmentDto = runApi { api.shipment(id) }
    suspend fun createShipment(body: CreateShipmentBody) = runApi { api.createShipment(body) }
    suspend fun updateShipment(id: String, body: UpdateShipmentBody) = runApi { api.updateShipment(id, body) }
    suspend fun addDevices(id: String, drafts: List<IntakeDraft>) =
        runApi { api.addDevices(id, RegisterDevicesBody(drafts.map { it.toBody() })) }

    /** Buy quantity products into a shipment (ADR 0030). */
    suspend fun addItems(id: String, items: List<PurchaseItemBody>): List<PurchasedLineDto> =
        runApi { api.addItems(id, RegisterItemsBody(items)) }

    // ── Shared device/model reads (owned here until an inventory slice lands) ──
    suspend fun deviceModels(): List<DeviceModelDto> = runApi { api.deviceModels() }

    // ── Code lookup for intake autofill (ADR 0031) ─────────────────────────────
    /** Resolve a code; null when the lists do not know it (404). Never blocks saving. */
    suspend fun lookup(code: String): CodeLookupResultDto? = runApi {
        try {
            api.codeLookup(code)
        } catch (e: AppException) {
            if (e.statusCode == 404) null else throw e
        }
    }

    suspend fun learnLink(refBrand: String, refModel: String, modelId: String) =
        runApi { api.learnLink(LearnLinkBody(refBrand, refModel, modelId)) }
    suspend fun devices(shipmentId: String? = null, inspected: String? = null, page: Int = 1): PaginatedDevicesDto =
        runApi { api.devices(shipmentId = shipmentId, inspected = inspected, page = page) }
    suspend fun deviceByImei(imei: String): QcDeviceDto = runApi { api.deviceByImei(imei) }

    // ── QC ─────────────────────────────────────────────────────────────────────
    suspend fun createInspection(body: CreateInspectionBody) = runApi { api.createInspection(body) }
    suspend fun inspections(passed: String? = null, page: Int = 1): PaginatedInspectionsDto =
        runApi { api.inspections(passed = passed, page = page) }
    suspend fun stats(from: String? = null, to: String? = null): QcStatsDto =
        runApi { api.stats(from, to) }
    suspend fun lookups(kind: String, includeInactive: Boolean): List<LookupDto> =
        runApi { api.lookups(kind, if (includeInactive) "true" else null) }
    suspend fun createLookup(kind: String, body: LookupBody) = runApi { api.createLookup(kind, body) }
    suspend fun updateLookup(kind: String, code: String, body: LookupBody) =
        runApi { api.updateLookup(kind, code, body) }
}
