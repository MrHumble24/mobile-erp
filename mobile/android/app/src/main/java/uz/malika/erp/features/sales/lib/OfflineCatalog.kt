package uz.malika.erp.features.sales.lib

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import uz.malika.erp.data.local.DeviceEntity
import uz.malika.erp.data.local.ProductEntity
import uz.malika.erp.features.sales.data.CatalogCard
import uz.malika.erp.features.sales.data.CatalogUnitItem
import uz.malika.erp.shared.lib.UnitCode
import uz.malika.erp.shared.lib.parseMoney

/**
 * Builds the till grid from the offline Room cache (ADR 0031) so a seller can
 * still tap to sell with no connection. Mirrors the server `/catalog` read:
 * IMEI/SERIAL products come from IN_STOCK devices grouped by model (count +
 * target-price range); QUANTITY products come from the cached product stock.
 * Category names are not cached, so [CatalogCard.categoryName] is null offline.
 * Pure — unit-tested.
 */
object OfflineCatalog {

    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    fun build(
        devices: List<DeviceEntity>,
        products: List<ProductEntity>,
        categoryNames: Map<String, String>,
        categoryId: String?,
        search: String,
    ): List<CatalogCard> {
        val inStock = devices.filter { it.statusCode == "IN_STOCK" }
        val specsByModel = inStock.groupBy { it.modelId }
            .mapValues { (_, ds) -> ds.joinToString(" ") { it.specs } }

        val unitCards = inStock.groupBy { it.modelId }.map { (modelId, ds) ->
            val first = ds.first()
            val prices = ds.mapNotNull { it.targetPrice?.takeIf { p -> p.isNotBlank() }?.let(::parseMoney) }
            CatalogCard(
                modelId = modelId,
                brand = first.modelBrand,
                name = first.modelName,
                kindCode = first.kindCode ?: "IMEI",
                categoryId = first.categoryId,
                categoryName = first.categoryId?.let { categoryNames[it] },
                imageUrl = first.imageUrl,
                inStock = ds.size,
                minTargetPrice = prices.minOrNull()?.toPlainString(),
                maxTargetPrice = prices.maxOrNull()?.toPlainString(),
                salePrice = null,
            )
        }
        val quantityCards = products.map { p ->
            CatalogCard(
                modelId = p.modelId, brand = p.brand, name = p.name, kindCode = "QUANTITY",
                categoryId = p.categoryId, categoryName = p.categoryId?.let { categoryNames[it] }, imageUrl = p.imageUrl,
                inStock = p.quantity, minTargetPrice = null, maxTargetPrice = null,
                salePrice = p.salePrice,
                prices = PriceCache.parse(p.pricesJson),
            )
        }

        val q = search.trim().lowercase()
        return (unitCards + quantityCards)
            .filter { card ->
                (categoryId == null || card.categoryId == categoryId) &&
                    (q.isEmpty() || matches(card, specsByModel[card.modelId], q))
            }
            .sortedWith(compareBy({ it.brand.lowercase() }, { it.name.lowercase() }))
    }

    private fun matches(card: CatalogCard, specsText: String?, q: String): Boolean {
        val haystack = buildString {
            append(card.brand).append(' ').append(card.name)
            specsText?.let { append(' ').append(it) }
        }.lowercase()
        return haystack.contains(q)
    }

    /** The IN_STOCK units of one model, for the unit picker (offline). */
    fun units(devices: List<DeviceEntity>, modelId: String): List<CatalogUnitItem> =
        devices.filter { it.statusCode == "IN_STOCK" && it.modelId == modelId }
            .map { d ->
                CatalogUnitItem(
                    id = d.id,
                    code = UnitCode.display(d.imei, d.serialNumber),
                    specs = parseSpecs(d.specs),
                    gradeCode = d.gradeCode,
                    targetPrice = d.targetPrice,
                    prices = PriceCache.parse(d.pricesJson),
                )
            }

    private fun parseSpecs(raw: String): Map<String, String> =
        runCatching {
            (json.parseToJsonElement(raw) as? JsonObject)?.mapNotNull { (k, v) ->
                (v as? JsonPrimitive)?.let { k to it.content }
            }?.toMap() ?: emptyMap()
        }.getOrElse { emptyMap() }
}
