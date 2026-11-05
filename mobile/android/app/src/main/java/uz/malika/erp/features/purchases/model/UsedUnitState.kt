package uz.malika.erp.features.purchases.model

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.serialization.json.JsonObjectBuilder
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import uz.malika.erp.features.inventory.data.DeviceModelView
import uz.malika.erp.features.inventory.data.ProductKind
import uz.malika.erp.shared.lib.UnitCode
import uz.malika.erp.shared.lib.isImei

/**
 * One used unit's identity, as entered when buying a phone from a customer or
 * taking one in trade-in (ADR 0039). Shared by both flows so the model picker,
 * specs and IMEI/serial fields are defined once (mirrors the web
 * `entities/device-model/lib/used-unit.ts`). Only IMEI/SERIAL models are picked;
 * QUANTITY products are filtered out by the field composable.
 */
class UsedUnitState {
    var model by mutableStateOf<DeviceModelView?>(null)
        private set
    val specs = mutableStateMapOf<String, String>()
    var dualSim by mutableStateOf(false)
    var imei by mutableStateOf("")
    var imei2 by mutableStateOf("")
    var serial by mutableStateOf("")

    val isSerial: Boolean get() = model?.kind == ProductKind.SERIAL

    /** Switch the model; a kind change clears the identifier, a change clears specs. */
    fun selectModel(next: DeviceModelView?) {
        val kindChanged = (model?.kind == ProductKind.SERIAL) != (next?.kind == ProductKind.SERIAL)
        if (kindChanged) { imei = ""; imei2 = ""; serial = "" }
        model = next
        specs.clear()
    }

    fun setSpec(key: String, value: String) { specs[key] = value }

    /** The form is complete: a model, required specs filled, and a valid identifier. */
    fun ready(): Boolean {
        val m = model ?: return false
        if (m.attributes.any { it.required && specs[it.key].isNullOrBlank() }) return false
        return if (m.kind == ProductKind.SERIAL) {
            UnitCode.isValidSerial(serial)
        } else {
            isImei(imei) && (!dualSim || isImei(imei2))
        }
    }

    /**
     * Writes the unit fields (`modelId`, `imei`/`imei2` or `serialNumber`, `specs`)
     * into a purchase / trade-in payload. Call only when [ready]. The money field
     * (`pricePaid` / `value`) is added by the caller.
     */
    fun appendUnit(builder: JsonObjectBuilder) {
        val m = model ?: return
        builder.put("modelId", m.id)
        if (m.kind == ProductKind.SERIAL) {
            builder.put("serialNumber", UnitCode.normalizeSerial(serial))
        } else {
            builder.put("imei", imei.trim())
            if (dualSim && imei2.isNotBlank()) builder.put("imei2", imei2.trim())
        }
        if (specs.isNotEmpty()) {
            builder.put("specs", buildJsonObject { specs.forEach { (k, v) -> if (v.isNotBlank()) put(k, v) } })
        }
    }

    /** A short label for the chosen model (for trade-in cart rows). */
    fun modelLabel(): String = model?.label ?: ""
}
