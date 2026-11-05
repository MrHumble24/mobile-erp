package uz.malika.erp.features.customs.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.toMutableStateList
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.customs.data.CreatePriceListBody
import uz.malika.erp.features.customs.data.CurrentListDto
import uz.malika.erp.features.customs.data.CustomsRepository
import uz.malika.erp.features.customs.lib.NewListRow
import uz.malika.erp.features.customs.lib.newListError
import uz.malika.erp.features.customs.lib.newListItems
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.Toaster
import uz.malika.erp.ui.theme.Tokens

/**
 * The owner's "new price list" sheet (perm `customs.manage`). Rows are pre-filled
 * from the current list; add/remove rows, optional effective date + note. The
 * two pre-send checks (empty list, duplicate code) are [newListError]; the save
 * posts a new version and toasts `customs.listSaved`.
 */
@Composable
fun NewListSheet(
    repo: CustomsRepository,
    prefill: CurrentListDto?,
    toaster: Toaster,
    onSaved: () -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    val rows = remember {
        (prefill?.items?.map { NewListRow(it.customsCode, it.description.orEmpty(), it.fee) }
            ?: listOf(NewListRow())).toMutableStateList()
    }
    var effectiveAt by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    fun submit() {
        val problem = newListError(rows)
        if (problem != null) { error = t(problem, null); return }
        error = null; busy = true
        val body = CreatePriceListBody(
            effectiveAt = effectiveAt.trim().ifBlank { null }?.let { "${it}T00:00:00.000Z" },
            note = note.trim().ifBlank { null },
            items = newListItems(rows),
        )
        scope.launch {
            try {
                repo.createPriceList(body)
                toaster.success(t("customs.listSaved", null))
                onSaved()
            } catch (e: AppException) {
                error = e.message
            } finally {
                busy = false
            }
        }
    }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp)) {
            Text(t("customs.newList", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            Spacer(Modifier.height(Tokens.Space.rowV))
            Text(t("customs.newListHint", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            Spacer(Modifier.height(Tokens.Space.section))
            AppFormField(t("customs.effectiveAt", null), effectiveAt, { effectiveAt = it }, placeholder = "yyyy-MM-dd")
            Spacer(Modifier.height(Tokens.Space.gap))
            AppFormField(t("customs.note", null), note, { note = it })
            Spacer(Modifier.height(Tokens.Space.section))

            rows.forEachIndexed { i, row ->
                NewListRowFields(
                    row = row,
                    onChange = { rows[i] = it },
                    onRemove = { rows.removeAt(i) },
                )
                Spacer(Modifier.height(Tokens.Space.gap))
            }

            PillButton(
                text = t("customs.addRow", null),
                onClick = { rows.add(NewListRow()) },
                modifier = Modifier.fillMaxWidth(),
                variant = ButtonVariant.OUTLINE,
            )

            error?.let {
                Spacer(Modifier.height(Tokens.Space.gap))
                Text(it, color = Tokens.danger, style = MaterialTheme.typography.bodyMedium)
            }
            Spacer(Modifier.height(Tokens.Space.section))
            PillButton(
                text = t(if (busy) "common.loading" else "customs.saveList", null),
                onClick = ::submit,
                enabled = !busy,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(Tokens.Space.gap))
        }
    }
}

/** One editable code/description/fee row with a remove button. */
@Composable
private fun NewListRowFields(row: NewListRow, onChange: (NewListRow) -> Unit, onRemove: () -> Unit) {
    val t = LocalT.current
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            AppFormField(t("customs.customsCode", null), row.code, { onChange(row.copy(code = it)) })
            Spacer(Modifier.height(Tokens.Space.rowV))
            AppFormField(t("customs.description", null), row.description, { onChange(row.copy(description = it)) })
            Spacer(Modifier.height(Tokens.Space.rowV))
            AppFormField(
                t("customs.fee", null), row.fee, { onChange(row.copy(fee = it)) },
                keyboardType = KeyboardType.Decimal,
            )
        }
        IconButton(onClick = onRemove) {
            Icon(Icons.Outlined.Close, contentDescription = t("customs.removeRow", null), tint = Tokens.muted)
        }
    }
}
