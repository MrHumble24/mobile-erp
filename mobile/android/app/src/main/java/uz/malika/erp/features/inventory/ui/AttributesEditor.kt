package uz.malika.erp.features.inventory.ui
import uz.malika.erp.shared.ui.AppSelect

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ArrowDownward
import androidx.compose.material.icons.outlined.ArrowUpward
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.inventory.data.AttributeDef
import uz.malika.erp.features.inventory.data.AttributeType
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl

/**
 * Controlled editor for a model's spec schema: add / remove / reorder
 * [AttributeDef] rows. The parent owns the list; this emits the next list.
 * Keys already persisted are locked (renaming would orphan stored specs).
 */
@Composable
fun AttributesEditor(
    attributes: List<AttributeDef>,
    savedKeys: Set<String>,
    onChanged: (List<AttributeDef>) -> Unit,
) {
    val t = LocalT.current

    fun reindex(list: List<AttributeDef>) = list.mapIndexed { i, a -> a.copy(sortOrder = i) }
    fun update(index: Int, next: AttributeDef) =
        onChanged(attributes.toMutableList().also { it[index] = next })
    fun add() = onChanged(attributes + AttributeDef("", "", AttributeType.TEXT, sortOrder = attributes.size))
    fun remove(index: Int) = onChanged(reindex(attributes.toMutableList().also { it.removeAt(index) }))
    fun move(index: Int, delta: Int) {
        val target = index + delta
        if (target !in attributes.indices) return
        val list = attributes.toMutableList()
        list.add(target, list.removeAt(index))
        onChanged(reindex(list))
    }

    Column(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text(t("inventory.attrSectionTitle", null), style = MaterialTheme.typography.labelLarge)
            PillButton(text = t("inventory.attrAdd", null), onClick = { add() }, variant = ButtonVariant.OUTLINE)
        }
        Spacer(Modifier.height(8.dp))
        attributes.forEachIndexed { i, attr ->
            AttributeRow(
                attr = attr,
                keyLocked = savedKeys.contains(attr.key),
                isFirst = i == 0,
                isLast = i == attributes.lastIndex,
                onChanged = { update(i, it) },
                onMoveUp = { move(i, -1) },
                onMoveDown = { move(i, 1) },
                onRemove = { remove(i) },
            )
            Spacer(Modifier.height(10.dp))
        }
    }
}

@Composable
private fun AttributeRow(
    attr: AttributeDef,
    keyLocked: Boolean,
    isFirst: Boolean,
    isLast: Boolean,
    onChanged: (AttributeDef) -> Unit,
    onMoveUp: () -> Unit,
    onMoveDown: () -> Unit,
    onRemove: () -> Unit,
) {
    val t = LocalT.current
    AppCard {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            AppFormField(
                label = t("inventory.attrLabel", null),
                value = attr.label,
                onValueChange = { onChanged(attr.copy(label = it)) },
                modifier = Modifier.weight(1f),
            )
            AppFormField(
                label = t("inventory.attrKey", null),
                value = attr.key,
                onValueChange = { onChanged(attr.copy(key = it)) },
                enabled = !keyLocked,
                modifier = Modifier.weight(1f),
            )
        }
        Spacer(Modifier.height(8.dp))
        AppSelect(
            value = attr.type,
            options = listOf(AttributeType.TEXT, AttributeType.NUMBER, AttributeType.SELECT),
            optionLabel = {
                when (it) {
                    AttributeType.TEXT -> t("inventory.attrTypeText", null)
                    AttributeType.NUMBER -> t("inventory.attrTypeNumber", null)
                    AttributeType.SELECT -> t("inventory.attrTypeSelect", null)
                }
            },
            onSelect = { onChanged(attr.copy(type = it ?: AttributeType.TEXT)) },
            label = t("inventory.attrType", null),
        )
        Spacer(Modifier.height(8.dp))
        Text(t("inventory.attrRequired", null), style = MaterialTheme.typography.labelMedium)
        Spacer(Modifier.height(4.dp))
        SegmentedControl(
            options = listOf(
                SegmentOption(true, t("common.yes", null)),
                SegmentOption(false, t("common.no", null)),
            ),
            selected = attr.required,
            onSelect = { onChanged(attr.copy(required = it)) },
        )
        if (attr.type == AttributeType.SELECT) {
            Spacer(Modifier.height(8.dp))
            OptionsChipsEditor(
                options = attr.options,
                onChanged = { onChanged(attr.copy(options = it)) },
            )
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            IconButton(onClick = onMoveUp, enabled = !isFirst) {
                Icon(Icons.Outlined.ArrowUpward, contentDescription = null)
            }
            IconButton(onClick = onMoveDown, enabled = !isLast) {
                Icon(Icons.Outlined.ArrowDownward, contentDescription = null)
            }
            IconButton(onClick = onRemove) {
                Icon(Icons.Outlined.DeleteOutline, contentDescription = null)
            }
        }
    }
}
