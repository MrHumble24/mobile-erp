package uz.malika.erp.features.inventory.data

import uz.malika.erp.core.runApi

/** The only place that talks to `/device-models`. Writes need `device.update`. */
class CatalogRepository(private val api: InventoryApi) {

    suspend fun list(): List<DeviceModelView> =
        runApi { api.deviceModels().map(DeviceModelView::fromDto) }

    suspend fun create(brand: String, name: String, attributes: List<AttributeDef>) = runApi {
        api.createModel(
            ModelWriteBody(
                brand = brand,
                name = name,
                attributes = attributes.map { it.toDto() },
            ),
        )
    }

    suspend fun update(
        id: String,
        brand: String,
        name: String,
        isActive: Boolean,
        attributes: List<AttributeDef>,
    ) = runApi {
        api.updateModel(
            id,
            ModelWriteBody(
                brand = brand,
                name = name,
                attributes = attributes.map { it.toDto() },
                isActive = isActive,
            ),
        )
    }
}
