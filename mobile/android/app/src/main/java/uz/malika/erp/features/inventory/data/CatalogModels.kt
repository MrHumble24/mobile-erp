package uz.malika.erp.features.inventory.data

/** Spec-field kind for a device-model attribute. Mirrors the server union. */
enum class AttributeType(val code: String) {
    TEXT("text"),
    NUMBER("number"),
    SELECT("select");

    companion object {
        fun fromCode(code: String?): AttributeType = when (code) {
            "number" -> NUMBER
            "select" -> SELECT
            else -> TEXT
        }
    }
}

/** One spec field defined on a model; drives the device spec inputs. */
data class AttributeDef(
    val key: String,
    val label: String,
    val type: AttributeType,
    val options: List<String> = emptyList(),
    val required: Boolean = false,
    val sortOrder: Int = 0,
) {
    fun toDto() = AttributeDefDto(
        key = key,
        label = label,
        type = type.code,
        options = if (type == AttributeType.SELECT) options else emptyList(),
        required = required,
        sortOrder = sortOrder,
    )

    companion object {
        fun fromDto(d: AttributeDefDto) = AttributeDef(
            key = d.key,
            label = d.label,
            type = AttributeType.fromCode(d.type),
            options = d.options,
            required = d.required,
            sortOrder = d.sortOrder,
        )
    }
}

/** A device model plus its dynamic attribute schema. */
data class DeviceModelView(
    val id: String,
    val brand: String,
    val name: String,
    val isActive: Boolean,
    val attributes: List<AttributeDef>,
) {
    val label: String get() = "$brand $name"

    companion object {
        fun fromDto(d: DeviceModelDto) = DeviceModelView(
            id = d.id,
            brand = d.brand,
            name = d.name,
            isActive = d.isActive,
            attributes = d.attributes.map(AttributeDef::fromDto),
        )
    }
}
