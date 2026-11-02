package uz.malika.erp.features.procurement.ui
import uz.malika.erp.shared.ui.AppSelect

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.procurement.data.AttributeDefDto
import uz.malika.erp.features.procurement.data.DeviceModelDto
import uz.malika.erp.features.procurement.data.IntakeDraft
import uz.malika.erp.features.procurement.lib.validateIntake
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ScannerField
import uz.malika.erp.ui.theme.Tokens

/**
 * Sticky model + specs + cost, with a [ScannerField] that stages one unit per
 * scan (model/specs/cost persist for the next unit — the intake loop). Calls
 * [onAdd] with a validated [IntakeDraft]; the cost clears for the next scan.
 */
@Composable
fun IntakeDeviceForm(
    models: List<DeviceModelDto>,
    onAdd: (IntakeDraft) -> Unit,
    modifier: Modifier = Modifier,
) {
    val t = LocalT.current
    var model by remember { mutableStateOf<DeviceModelDto?>(null) }
    val specs = remember { mutableStateMapOf<String, String>() }
    var cost by remember { mutableStateOf("") }
    var target by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    fun add(imei: String) {
        val m = model
        val costNum = cost.trim().toDoubleOrNull()
        val key = validateIntake(imei.trim(), m != null, costNum, m?.attributes ?: emptyList(), specs)
        if (key != null) { error = t(key, null); return }
        onAdd(IntakeDraft(imei.trim(), m!!.id, specs.toMap(), costNum!!, target.trim().toDoubleOrNull()))
        error = null
        cost = ""
    }

    Column(modifier) {
        AppSelect(
            label = t("shipments.selectModel", null),
            value = model,
            options = models,
            optionLabel = { it.label },
            onSelect = { model = it; specs.clear() },
        )
        model?.attributes?.forEach { attr ->
            Spacer(Modifier.height(12.dp))
            SpecField(attr, specs[attr.key] ?: "") { specs[attr.key] = it }
        }
        Spacer(Modifier.height(12.dp))
        Row {
            AppFormField(
                t("shipments.acquisitionCost", null), cost, { cost = it },
                keyboardType = KeyboardType.Decimal, modifier = Modifier.weight(1f),
            )
            Spacer(Modifier.width(12.dp))
            AppFormField(
                t("shipments.targetPrice", null), target, { target = it },
                keyboardType = KeyboardType.Decimal, modifier = Modifier.weight(1f),
            )
        }
        Spacer(Modifier.height(12.dp))
        Text(t("shipments.scanImei", null), style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(6.dp))
        ScannerField(onScan = ::add, placeholder = t("shipments.scanImei", null))
        error?.let {
            Spacer(Modifier.height(10.dp))
            Text(it, color = Tokens.destructive, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

/** One spec input, chosen by attribute type (select → dropdown, else text). */
@Composable
private fun SpecField(attr: AttributeDefDto, value: String, onChange: (String) -> Unit) {
    val label = if (attr.required) "${attr.label} *" else attr.label
    if (attr.type == "select" && attr.options.isNotEmpty()) {
        AppSelect(
            label = label,
            value = attr.options.firstOrNull { it == value },
            options = attr.options,
            optionLabel = { it },
            onSelect = { it?.let(onChange) },
        )
    } else {
        AppFormField(
            label = label,
            value = value,
            onValueChange = onChange,
            keyboardType = if (attr.type == "number") KeyboardType.Number else KeyboardType.Text,
        )
    }
}
