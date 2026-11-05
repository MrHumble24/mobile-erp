package uz.malika.erp.features.inventory.data

import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.add
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import uz.malika.erp.core.runApi

/** The only place that talks to `/device-models` and `/product-categories`. Writes need `device.update`. */
class CatalogRepository(private val api: InventoryApi) {

    /** Upload a product picture (ADR 0031); returns the refreshed model view. */
    suspend fun uploadImage(id: String, bytes: ByteArray, mime: String, filename: String): DeviceModelView =
        runApi {
            val part = MultipartBody.Part.createFormData(
                "file", filename, bytes.toRequestBody(mime.toMediaTypeOrNull()),
            )
            DeviceModelView.fromDto(api.uploadModelImage(id, part))
        }

    /** Remove a product's picture; returns the refreshed model view. */
    suspend fun removeImage(id: String): DeviceModelView =
        runApi { DeviceModelView.fromDto(api.deleteModelImage(id)) }

    suspend fun list(): List<DeviceModelView> =
        runApi { api.deviceModels().map(DeviceModelView::fromDto) }

    suspend fun categories(): List<ProductCategoryDto> = runApi { api.categories() }

    suspend fun create(form: ModelForm) = runApi { api.createModel(form.toJson(isEdit = false)) }

    suspend fun update(id: String, form: ModelForm) = runApi { api.updateModel(id, form.toJson(isEdit = true)) }

    suspend fun createCategory(name: String): ProductCategoryDto =
        runApi { api.createCategory(CategoryBody(name = name)) }

    suspend fun updateCategory(id: String, body: CategoryBody): ProductCategoryDto =
        runApi { api.updateCategory(id, body) }
}

/**
 * One product-form submission. On create, blank optionals are omitted; on edit
 * they are sent as explicit `null` so blanking a field clears it server-side
 * (the Json config drops typed nulls, so the body is hand-built). [isActive] is
 * sent on edit only.
 */
data class ModelForm(
    val brand: String,
    val name: String,
    val kind: ProductKind,
    val categoryId: String?,
    val barcode: String?,
    val modelCode: String?,
    val customsCode: String?,
    val attributes: List<AttributeDef>,
    val isActive: Boolean = true,
    /** QUANTITY only: default till price per piece (ADR 0030); a decimal string. */
    val salePrice: String? = null,
) {
    fun toJson(isEdit: Boolean): JsonObject = buildJsonObject {
        put("brand", brand)
        put("name", name)
        put("kindCode", kind.code)
        if (isEdit) put("isActive", isActive)
        optional("categoryId", categoryId, isEdit)
        optional("barcode", barcode, isEdit)
        optional("modelCode", modelCode, isEdit)
        optional("customsCode", customsCode, isEdit)
        // salePrice is a per-piece default for QUANTITY products only (a number).
        if (kind == ProductKind.QUANTITY) {
            val price = salePrice?.trim()?.ifBlank { null }
            when {
                price != null -> put("salePrice", JsonPrimitive(uz.malika.erp.shared.lib.parseMoney(price)))
                isEdit -> put("salePrice", JsonNull)
            }
        }
        put(
            "attributes",
            buildJsonArray {
                attributes.forEach { a ->
                    add(
                        buildJsonObject {
                            put("key", a.key)
                            put("label", a.label)
                            put("type", a.type.code)
                            put("required", a.required)
                            put("sortOrder", a.sortOrder)
                            if (a.type == AttributeType.SELECT) {
                                put("options", buildJsonArray { a.options.forEach { add(it) } })
                            }
                        },
                    )
                }
            },
        )
    }

    /** Edit: null clears (explicit null). Create: null is just omitted. */
    private fun kotlinx.serialization.json.JsonObjectBuilder.optional(key: String, value: String?, isEdit: Boolean) {
        when {
            value != null -> put(key, JsonPrimitive(value))
            isEdit -> put(key, JsonNull)
        }
    }
}
