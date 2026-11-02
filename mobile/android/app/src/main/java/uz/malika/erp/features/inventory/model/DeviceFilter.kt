package uz.malika.erp.features.inventory.model

import uz.malika.erp.features.inventory.data.DeviceListItem

/** Client-side filters over the cached device list. */
data class DeviceFilter(
    val search: String = "",
    val modelId: String? = null,
    val storage: String? = null,
    val statusCode: String? = null,
) {
    val isEmpty: Boolean
        get() = search.isBlank() && modelId == null && storage == null && statusCode == null

    fun apply(list: List<DeviceListItem>): List<DeviceListItem> = list.filter { d ->
        d.matches(search) &&
            (modelId == null || d.modelId == modelId) &&
            (storage == null || d.storage == storage) &&
            (statusCode == null || d.statusCode == statusCode)
    }
}

/** Counts over the full cached list, for the metrics bar. */
data class DeviceMetrics(
    val total: Int = 0,
    val inStock: Int = 0,
    val defective: Int = 0,
    val consigned: Int = 0,
) {
    companion object {
        fun from(list: List<DeviceListItem>) = DeviceMetrics(
            total = list.size,
            inStock = list.count { it.statusCode == "IN_STOCK" },
            defective = list.count { it.statusCode == "DEFECTIVE" },
            consigned = list.count { it.statusCode == "CONSIGNED" },
        )
    }
}

/** Storage options offered in the filters / rule form when a model defines none. */
val FALLBACK_STORAGES = listOf("64GB", "128GB", "256GB", "512GB", "1TB")
