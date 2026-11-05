package uz.malika.erp.data.sync

import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive
import uz.malika.erp.data.local.DeviceEntity
import uz.malika.erp.data.local.PartnerEntity
import uz.malika.erp.data.local.ProductEntity
import uz.malika.erp.data.remote.DeviceSyncDto
import uz.malika.erp.data.remote.PartnerSyncDto
import uz.malika.erp.data.remote.ProductSyncDto
import uz.malika.erp.features.sales.lib.PriceCache

/**
 * Maps `/sync/changes` DTOs into Room entities. Kept separate so the pull
 * service stays about paging, not field plucking. JSON blobs (specs, latestSale)
 * are stored verbatim as text; money arrives as Decimal strings or numbers.
 */
object ChangesMapper {

    fun device(d: DeviceSyncDto) = DeviceEntity(
        id = d.id,
        imei = d.imei,
        imei2 = d.imei2,
        serialNumber = d.serialNumber,
        kindCode = d.model?.kindCode,
        statusCode = d.statusCode,
        version = d.version,
        targetPrice = d.targetPrice.asScalar(),
        specs = d.specs?.takeUnless { it is JsonNull }?.toString() ?: "{}",
        modelId = d.model?.id ?: "",
        modelBrand = d.model?.brand ?: "",
        modelName = d.model?.name ?: "",
        categoryId = d.model?.categoryId,
        imageUrl = d.model?.imageUrl,
        pricesJson = PriceCache.encode(d.prices),
        latestSale = d.latestSale?.takeUnless { it is JsonNull }?.toString(),
        gradeCode = d.latestInspection?.gradeCode,
        inspectionNotes = d.latestInspection?.notes,
        updatedAt = d.updatedAt,
    )

    fun product(p: ProductSyncDto) = ProductEntity(
        modelId = p.modelId,
        brand = p.brand,
        name = p.name,
        barcode = p.barcode,
        salePrice = p.salePrice.asScalar(),
        quantity = p.quantity,
        categoryId = p.categoryId,
        imageUrl = p.imageUrl,
        pricesJson = PriceCache.encode(p.prices),
    )

    fun partner(p: PartnerSyncDto) = PartnerEntity(
        id = p.id,
        shopName = p.shopName,
        phone = p.phone,
        creditLimit = p.creditLimit.asScalar() ?: "0",
        outstanding = p.outstanding.asScalar() ?: "0",
    )

    /** A JSON primitive (string or number) as its bare string; null otherwise. */
    private fun JsonElement?.asScalar(): String? =
        (this as? JsonPrimitive)?.takeUnless { it is JsonNull }?.content
}
