package uz.malika.erp.features.inventory.data

import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.add
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import uz.malika.erp.core.runApi
import java.math.BigDecimal

/** One cell of the product price grid: a storage (null = any) × level price. */
data class ProductPriceCell(val storage: String?, val levelCode: String, val price: BigDecimal?)

/**
 * The only door to `/pricing` (permission `price.manage`, ADR 0034). Sends the
 * full grid in one PUT with explicit nulls so a cleared cell is cleared.
 */
class PricingRepository(private val api: PricingApi) {

    suspend fun getProduct(modelId: String): ProductPricesDto = runApi { api.productPrices(modelId) }

    suspend fun setProduct(modelId: String, cells: List<ProductPriceCell>): ProductPricesDto = runApi {
        val body = buildJsonObject {
            put(
                "prices",
                buildJsonArray {
                    cells.forEach { c ->
                        add(
                            buildJsonObject {
                                put("storage", c.storage?.let { JsonPrimitive(it) } ?: JsonNull)
                                put("levelCode", c.levelCode)
                                put("price", c.price?.let { JsonPrimitive(it) } ?: JsonNull)
                            },
                        )
                    }
                },
            )
        }
        api.setProductPrices(modelId, body)
    }

    suspend fun getUnit(deviceId: String): UnitPricesDto = runApi { api.unitPrices(deviceId) }

    suspend fun setUnit(deviceId: String, cells: Map<String, BigDecimal?>): UnitPricesDto = runApi {
        val body = buildJsonObject {
            put(
                "prices",
                buildJsonArray {
                    cells.forEach { (level, price) ->
                        add(
                            buildJsonObject {
                                put("levelCode", level)
                                put("price", price?.let { JsonPrimitive(it) } ?: JsonNull)
                            },
                        )
                    }
                },
            )
        }
        api.setUnitPrices(deviceId, body)
    }
}
