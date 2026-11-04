package uz.malika.erp.features.inventory.ui
import uz.malika.erp.shared.ui.AppSelect

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.inventory.data.AttributeDef
import uz.malika.erp.features.inventory.data.AttributeType
import uz.malika.erp.shared.ui.AppFormField

/**
 * One input per model attribute (sorted by order), bound to a `specs` map the
 * caller owns. `select` with options → [AppSelect]; a `select` whose option list
 * is still empty (the server's default storage/color scaffold, or a list the
 * owner has not filled yet) falls back to a text field — the server accepts any
 * value for an option-less select, and an empty dropdown would block the save.
 * `number` → numeric field, else text.
 */
@Composable
fun DynamicSpecFields(
    attributes: List<AttributeDef>,
    values: Map<String, String>,
    onChanged: (key: String, value: String) -> Unit,
) {
    val sorted = attributes.sortedBy { it.sortOrder }
    Column {
        sorted.forEach { attr ->
            val label = if (attr.required) "${attr.label} *" else attr.label
            val value = values[attr.key] ?: ""
            if (attr.type == AttributeType.SELECT && attr.options.isNotEmpty()) {
                AppSelect(
                    value = value.ifEmpty { null },
                    options = attr.options,
                    optionLabel = { it },
                    onSelect = { onChanged(attr.key, it ?: "") },
                    label = label,
                )
            } else {
                AppFormField(
                    label = label,
                    value = value,
                    onValueChange = { onChanged(attr.key, it) },
                    keyboardType = if (attr.type == AttributeType.NUMBER) KeyboardType.Decimal else KeyboardType.Text,
                )
            }
            Spacer(Modifier.height(12.dp))
        }
    }
}
