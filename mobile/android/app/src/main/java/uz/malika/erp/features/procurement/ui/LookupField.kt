package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import kotlinx.coroutines.launch
import uz.malika.erp.features.procurement.data.CodeLookupResultDto
import uz.malika.erp.features.procurement.data.DeviceModelDto
import uz.malika.erp.features.procurement.data.LookupReferenceDto
import uz.malika.erp.features.procurement.data.ProcurementRepository
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppCheckbox
import uz.malika.erp.shared.ui.AppSelect
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.ScannerField
import uz.malika.erp.ui.theme.Tokens

private sealed interface LookupUi {
    data object Idle : LookupUi
    data object Loading : LookupUi
    data class Found(val label: String) : LookupUi
    data class NeedsPick(val reference: LookupReferenceDto) : LookupUi
    data object NotFound : LookupUi
    data object Remembered : LookupUi
}

/**
 * The "IMEI or code on the box" field (ADR 0031): scanning/typing a code asks
 * `GET /lookup`. When it names one of our products, the model + storage/colour
 * are filled ([onFill]); when the lists know the code but not our product, the
 * seller picks it once (optionally remembered via `POST /lookup/links`); a 404 is
 * a quiet hint. The lookup never blocks saving — it only autofills.
 */
@Composable
fun LookupField(
    models: List<DeviceModelDto>,
    online: Boolean,
    canLearn: Boolean,
    repo: ProcurementRepository,
    onFill: (modelId: String?, storage: String?, color: String?) -> Unit,
    modifier: Modifier = Modifier,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    var ui by remember { mutableStateOf<LookupUi>(LookupUi.Idle) }
    var picking by remember { mutableStateOf<LookupReferenceDto?>(null) }

    fun resolve(code: String) {
        val trimmed = code.trim()
        if (trimmed.isEmpty() || !online) return
        ui = LookupUi.Loading
        scope.launch {
            val result: CodeLookupResultDto? = runCatching { repo.lookup(trimmed) }.getOrNull()
            ui = when {
                result == null -> LookupUi.NotFound
                result.product != null -> {
                    onFill(result.product.modelId, result.product.storageOption, result.product.colorOption)
                    LookupUi.Found(result.product.label)
                }
                else -> LookupUi.NeedsPick(result.reference)
            }
        }
    }

    Column(modifier.fillMaxWidth()) {
        Text(t("catalog.boxCode", null), style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
        Spacer(Modifier.height(Tokens.Space.rowV))
        ScannerField(onScan = { code, _ -> resolve(code) }, placeholder = t("catalog.boxCodeHint", null), autofocus = false)
        Spacer(Modifier.height(Tokens.Space.rowV))
        when (val state = ui) {
            is LookupUi.Found ->
                StatusLine(t("catalog.lookupFound", mapOf("model" to state.label)), Tokens.success)
            is LookupUi.NeedsPick -> {
                StatusLine(state.reference.label, Tokens.text)
                Spacer(Modifier.height(Tokens.Space.rowV))
                PillButton(text = t("catalog.lookupPickProduct", null), onClick = { picking = state.reference })
            }
            LookupUi.NotFound -> StatusLine(t("catalog.lookupNotFound", null), Tokens.muted)
            LookupUi.Remembered -> StatusLine(t("catalog.lookupRemembered", null), Tokens.success)
            LookupUi.Loading -> StatusLine("…", Tokens.muted)
            LookupUi.Idle -> Unit
        }
        Spacer(Modifier.height(Tokens.Space.rowV))
        Text(t("catalog.dataCredit", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
    }

    picking?.let { reference ->
        AppBottomSheet(onDismiss = { picking = null }) {
            PickProductSheet(
                reference = reference,
                models = models,
                canLearn = canLearn,
                onConfirm = { modelId, remember ->
                    onFill(modelId, null, null)
                    if (remember && canLearn) {
                        scope.launch { runCatching { repo.learnLink(reference.brand, reference.model, modelId) } }
                        ui = LookupUi.Remembered
                    } else {
                        ui = LookupUi.Found(models.firstOrNull { it.id == modelId }?.label ?: "")
                    }
                    picking = null
                },
            )
        }
    }
}

@Composable
private fun StatusLine(text: String, color: androidx.compose.ui.graphics.Color) {
    Text(text, style = MaterialTheme.typography.bodyMedium, color = color)
}

@Composable
private fun PickProductSheet(
    reference: LookupReferenceDto,
    models: List<DeviceModelDto>,
    canLearn: Boolean,
    onConfirm: (modelId: String, remember: Boolean) -> Unit,
) {
    val t = LocalT.current
    var picked by remember { mutableStateOf<DeviceModelDto?>(null) }
    var remember by remember { mutableStateOf(canLearn) }
    Column(Modifier.fillMaxWidth().padding(Tokens.Space.gutter)) {
        Text(t("catalog.lookupPickProduct", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.xs))
        Text(reference.label, style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
        Spacer(Modifier.height(Tokens.Space.lg))
        AppSelect(
            value = picked,
            options = models,
            optionLabel = { it.label },
            onSelect = { picked = it },
            label = t("shipments.selectModel", null),
        )
        if (canLearn) {
            Spacer(Modifier.height(Tokens.Space.md))
            androidx.compose.foundation.layout.Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                AppCheckbox(checked = remember, onCheckedChange = { remember = it })
                Spacer(Modifier.height(Tokens.Space.rowV))
                Text(t("catalog.lookupRemember", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
            }
        }
        Spacer(Modifier.height(Tokens.Space.lg))
        PillButton(
            text = t("common.save", null),
            onClick = { picked?.let { onConfirm(it.id, remember) } },
            enabled = picked != null,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
