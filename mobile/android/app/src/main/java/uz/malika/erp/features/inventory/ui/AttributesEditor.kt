package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.text.input.KeyboardType
import uz.malika.erp.features.inventory.data.AttributeDef
import uz.malika.erp.features.inventory.data.AttributeType
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AdaptiveInputs
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.AppSelect
import uz.malika.erp.shared.ui.AppSwitch
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/**
 * Controlled editor for a model's spec schema: add / remove / reorder
 * [AttributeDef] rows. The parent owns the list; this emits the next list.
 * Keys already persisted are locked (renaming would orphan stored specs).
 * Each attribute is a surface-2 block inside the sheet (never a nested card).
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
            Text(t("inventory.attrSectionTitle", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
            PillButton(text = t("inventory.attrAdd", null), onClick = { add() }, variant = ButtonVariant.SECONDARY)
        }
        Spacer(Modifier.height(Tokens.Space.md))
        attributes.forEachIndexed { i, attr ->
            AttributeBlock(
                attr = attr,
                keyLocked = savedKeys.contains(attr.key),
                isFirst = i == 0,
                isLast = i == attributes.lastIndex,
                onChanged = { update(i, it) },
                onMoveUp = { move(i, -1) },
                onMoveDown = { move(i, 1) },
                onRemove = { remove(i) },
            )
            if (i < attributes.lastIndex) Spacer(Modifier.height(Tokens.Space.md))
        }
    }
}

@Composable
private fun AttributeBlock(
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
    Column(
        Modifier
            .fillMaxWidth()
            .background(Tokens.surface2, RoundedCornerShape(Tokens.Radius.controls))
            .padding(Tokens.Space.lg),
    ) {
        AdaptiveInputs(
            fields = listOf(
                { m ->
                    AppFormField(
                        label = t("inventory.attrLabel", null),
                        value = attr.label,
                        onValueChange = { onChanged(attr.copy(label = it)) },
                        modifier = m,
                    )
                },
                { m ->
                    AppFormField(
                        label = t("inventory.attrKey", null),
                        value = attr.key,
                        onValueChange = { onChanged(attr.copy(key = it)) },
                        enabled = !keyLocked,
                        keyboardType = KeyboardType.Ascii,
                        modifier = m,
                    )
                },
            ),
            spacing = Tokens.Space.md,
        )
        Spacer(Modifier.height(Tokens.Space.md))
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
        if (attr.type == AttributeType.SELECT) {
            Spacer(Modifier.height(Tokens.Space.md))
            OptionsChipsEditor(
                options = attr.options,
                onChanged = { onChanged(attr.copy(options = it)) },
            )
        }
        Spacer(Modifier.height(Tokens.Space.sm))
        Row(Modifier.fillMaxWidth().heightIn(min = Tokens.minTouch), verticalAlignment = Alignment.CenterVertically) {
            Text(t("inventory.attrRequired", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
            Spacer(Modifier.weight(1f))
            AppSwitch(checked = attr.required, onCheckedChange = { onChanged(attr.copy(required = it)) })
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            IconButton(onClick = onMoveUp, enabled = !isFirst) {
                Icon(Icons.Outlined.ArrowUpward, contentDescription = null, tint = if (isFirst) Tokens.border else Tokens.muted)
            }
            IconButton(onClick = onMoveDown, enabled = !isLast) {
                Icon(Icons.Outlined.ArrowDownward, contentDescription = null, tint = if (isLast) Tokens.border else Tokens.muted)
            }
            IconButton(onClick = onRemove) {
                Icon(Icons.Outlined.DeleteOutline, contentDescription = null, tint = Tokens.danger)
            }
        }
    }
}
