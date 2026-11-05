package uz.malika.erp.features.purchases.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.features.inventory.data.DeviceModelView
import uz.malika.erp.features.inventory.data.ProductKind
import uz.malika.erp.features.inventory.ui.DynamicSpecFields
import uz.malika.erp.features.purchases.model.UsedUnitState
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.UnitCode
import uz.malika.erp.shared.lib.isImei
import uz.malika.erp.shared.ui.AppSelect
import uz.malika.erp.shared.ui.AppSwitch
import uz.malika.erp.shared.ui.ScannerField
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.ui.Alignment
import uz.malika.erp.ui.theme.Tokens

/**
 * Model picker + the model's spec fields + the kind's identifier (IMEI with an
 * optional dual-SIM second slot, or a serial number), for entering a used unit
 * (ADR 0039). Shared by the "Buy a phone" sheet and the till's trade-in. Pure
 * render + dispatch — state lives in the caller's [UsedUnitState]. QUANTITY
 * products are filtered out (the server refuses them).
 */
@Composable
fun UsedUnitFields(state: UsedUnitState, models: List<DeviceModelView>, enabled: Boolean = true) {
    val t = LocalT.current
    val sellable = models.filter { it.kind != ProductKind.QUANTITY }

    Column(Modifier.fillMaxWidth()) {
        AppSelect(
            value = state.model,
            options = sellable,
            optionLabel = { it.label },
            onSelect = { state.selectModel(it) },
            label = t("inventory.model", null),
            enabled = enabled,
        )
        val model = state.model
        if (model != null) {
            Spacer(Modifier.height(Tokens.Space.md))
            if (model.attributes.isNotEmpty()) {
                DynamicSpecFields(
                    attributes = model.attributes,
                    values = state.specs,
                    onChanged = { k, v -> state.setSpec(k, v) },
                )
            }
            IdentifierFields(state, enabled)
        }
    }
}

@Composable
private fun IdentifierFields(state: UsedUnitState, enabled: Boolean) {
    val t = LocalT.current
    if (state.isSerial) {
        Text(t("catalog.serialNumber", null), style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
        Spacer(Modifier.height(Tokens.Space.rowV))
        ScannerField(
            onScan = { raw, _ -> state.serial = UnitCode.normalizeSerial(raw) },
            placeholder = t("catalog.serialNumberHint", null),
        )
        CodeValue(state.serial)
    } else {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text(t("shipments.scanImei", null), style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(t("inventory.dualSim", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
                Spacer(Modifier.width(Tokens.Space.sm))
                AppSwitch(checked = state.dualSim, onCheckedChange = { state.dualSim = it; if (!it) state.imei2 = "" }, enabled = enabled)
            }
        }
        Spacer(Modifier.height(Tokens.Space.rowV))
        ScannerField(onScan = { raw, _ -> state.imei = raw.trim() }, placeholder = t("shipments.scanImei", null))
        CodeValue(state.imei)
        if (state.dualSim) {
            Spacer(Modifier.height(Tokens.Space.sm))
            Text(t("inventory.imei2", null), style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
            Spacer(Modifier.height(Tokens.Space.rowV))
            ScannerField(onScan = { raw, _ -> state.imei2 = raw.trim() }, placeholder = t("inventory.imei2Hint", null), autofocus = false)
            CodeValue(state.imei2)
        }
    }
}

/** Shows the entered code, tinted red while it is non-blank but not yet valid. */
@Composable
private fun CodeValue(code: String) {
    if (code.isBlank()) return
    val valid = isImei(code) || UnitCode.isValidSerial(code)
    Spacer(Modifier.height(Tokens.Space.rowV))
    Text(code, style = MaterialTheme.typography.bodyMedium, color = if (valid) Tokens.text else Tokens.danger)
}
