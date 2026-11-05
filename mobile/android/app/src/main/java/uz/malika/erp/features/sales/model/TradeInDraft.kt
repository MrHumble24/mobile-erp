package uz.malika.erp.features.sales.model

import uz.malika.erp.features.inventory.data.ProductKind
import uz.malika.erp.features.purchases.model.UsedUnitState
import java.math.BigDecimal

/**
 * One phone the customer gives in part payment at the till (ADR 0039), held as a
 * cart draft until checkout. Its value lowers what the customer tenders; it rides
 * one sale line's `POST /sales` and becomes a customer purchase there. A cart with
 * trade-ins is online only (never queued).
 */
data class TradeInDraft(
    val id: String,
    val modelId: String,
    val modelLabel: String,
    val kind: ProductKind,
    val imei: String?,
    val imei2: String?,
    val serialNumber: String?,
    val specs: Map<String, String>,
    val value: BigDecimal,
) {
    /** IMEI or serial, for the cart row. */
    val code: String get() = imei?.takeIf { it.isNotBlank() } ?: serialNumber?.takeIf { it.isNotBlank() } ?: ""

    companion object {
        private var seq = 0

        /** Snapshot a filled [UsedUnitState] + its agreed value into an immutable draft. */
        fun from(unit: UsedUnitState, value: BigDecimal): TradeInDraft {
            val model = unit.model!!
            val isSerial = model.kind == ProductKind.SERIAL
            return TradeInDraft(
                id = "ti_${seq++}_${System.nanoTime()}",
                modelId = model.id,
                modelLabel = model.label,
                kind = model.kind,
                imei = if (isSerial) null else unit.imei.trim().ifBlank { null },
                imei2 = if (isSerial || !unit.dualSim) null else unit.imei2.trim().ifBlank { null },
                serialNumber = if (isSerial) uz.malika.erp.shared.lib.UnitCode.normalizeSerial(unit.serial) else null,
                specs = unit.specs.filterValues { it.isNotBlank() }.toMap(),
                value = value,
            )
        }
    }
}
