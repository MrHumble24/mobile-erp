package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.inventory.data.ModelForm
import uz.malika.erp.features.inventory.data.ProductCategoryDto
import uz.malika.erp.features.inventory.data.ProductKind
import uz.malika.erp.features.inventory.data.DeviceModelView
import uz.malika.erp.features.inventory.model.CatalogViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.AppSelect
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.AppSwitch
import uz.malika.erp.ui.theme.Tokens

/**
 * Create / edit a product (device model): kind, category, barcode, maker's model
 * code, customs code and the dynamic attribute schema. Online-only; save is
 * blocked offline. A 409 is mapped to the field that collided (name / barcode /
 * kind) so the operator sees why.
 */
@Composable
fun ModelFormSheet(
    model: DeviceModelView?,
    catalogVm: CatalogViewModel,
    online: Boolean,
    baseUrl: String,
    onToast: (String) -> Unit,
    onSaved: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    val isEdit = model != null
    val categories by catalogVm.categories.collectAsState()

    var brand by remember { mutableStateOf(model?.brand ?: "") }
    var name by remember { mutableStateOf(model?.name ?: "") }
    var kind by remember { mutableStateOf(model?.kind ?: ProductKind.IMEI) }
    var categoryId by remember { mutableStateOf(model?.categoryId) }
    var barcode by remember { mutableStateOf(model?.barcode ?: "") }
    var modelCode by remember { mutableStateOf(model?.modelCode ?: "") }
    var customsCode by remember { mutableStateOf(model?.customsCode ?: "") }
    var salePrice by remember { mutableStateOf(model?.salePrice ?: "") }
    var active by remember { mutableStateOf(model?.isActive ?: true) }
    var attributes by remember { mutableStateOf(model?.attributes ?: emptyList()) }
    val savedKeys = remember { model?.attributes?.map { it.key }?.toSet() ?: emptySet() }
    var saving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    fun save() {
        if (brand.isBlank() || name.isBlank()) {
            error = t("common.required", null); return
        }
        saving = true
        error = null
        scope.launch {
            try {
                val form = ModelForm(
                    brand = brand.trim(),
                    name = name.trim(),
                    kind = kind,
                    categoryId = categoryId,
                    barcode = barcode.trim().ifBlank { null },
                    modelCode = modelCode.trim().ifBlank { null },
                    customsCode = customsCode.trim().ifBlank { null },
                    attributes = if (kind == ProductKind.QUANTITY) emptyList() else attributes,
                    isActive = active,
                    salePrice = salePrice,
                )
                if (isEdit) catalogVm.update(model!!.id, form) else catalogVm.create(form)
                onSaved()
            } catch (e: AppException) {
                saving = false
                error = conflictKey(e)?.let { t(it, null) } ?: e.message
            }
        }
    }

    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter)) {
        Text(
            t(if (isEdit) "inventory.editModel" else "inventory.newModel", null),
            style = MaterialTheme.typography.titleLarge,
            color = Tokens.text,
        )
        Spacer(Modifier.height(Tokens.Space.lg))
        // The picture needs a saved model (an id), so it shows on edit only.
        if (isEdit) {
            ProductImageSection(
                modelId = model!!.id,
                initialImageUrl = model.imageUrl,
                baseUrl = baseUrl,
                catalogVm = catalogVm,
                online = online,
                onToast = onToast,
            )
            Spacer(Modifier.height(Tokens.Space.lg))
        }
        AppFormField(label = t("inventory.brand", null), value = brand, onValueChange = { brand = it })
        Spacer(Modifier.height(Tokens.Space.md))
        AppFormField(label = t("inventory.model", null), value = name, onValueChange = { name = it })
        Spacer(Modifier.height(Tokens.Space.md))
        ProductKindPicker(selected = kind, onSelect = { kind = it }, enabled = true)
        Spacer(Modifier.height(Tokens.Space.md))
        AppSelect(
            label = t("catalog.category", null),
            value = categories.firstOrNull { it.id == categoryId },
            options = categories,
            optionLabel = ProductCategoryDto::name,
            onSelect = { categoryId = it?.id },
            nullOption = t("catalog.noCategory", null),
        )
        Spacer(Modifier.height(Tokens.Space.md))
        LabeledField(t("catalog.barcode", null), barcode, { barcode = it }, t("catalog.barcodeHint", null))
        Spacer(Modifier.height(Tokens.Space.md))
        LabeledField(t("catalog.modelCode", null), modelCode, { modelCode = it }, t("catalog.modelCodeHint", null))
        // A quantity product carries a per-piece sale price instead of a customs
        // code and the unit attribute schema (ADR 0030).
        if (kind == ProductKind.QUANTITY) {
            Spacer(Modifier.height(Tokens.Space.md))
            AppFormField(
                label = t("catalog.salePrice", null),
                value = salePrice,
                onValueChange = { salePrice = it },
                keyboardType = androidx.compose.ui.text.input.KeyboardType.Decimal,
            )
        } else {
            Spacer(Modifier.height(Tokens.Space.md))
            LabeledField(t("inventory.customsCode", null), customsCode, { customsCode = it }, t("inventory.customsCodeHint", null))
        }
        if (isEdit) {
            Spacer(Modifier.height(Tokens.Space.md))
            Row(
                Modifier.fillMaxWidth().heightIn(min = Tokens.minTouch),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(t("inventory.modelActive", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
                Spacer(Modifier.weight(1f))
                AppSwitch(checked = active, onCheckedChange = { active = it })
            }
        }
        if (kind != ProductKind.QUANTITY) {
            Spacer(Modifier.height(Tokens.Space.lg))
            AttributesEditor(attributes = attributes, savedKeys = savedKeys, onChanged = { attributes = it })
        }
        error?.let {
            Spacer(Modifier.height(Tokens.Space.md))
            Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
        }
        if (!online) {
            Spacer(Modifier.height(Tokens.Space.md))
            Text(t("common.offline", null), style = MaterialTheme.typography.bodySmall, color = Tokens.warning)
        }
        Spacer(Modifier.height(Tokens.Space.gutter))
        PillButton(
            text = if (saving) t("common.loading", null) else t("common.save", null),
            onClick = { save() },
            enabled = online && !saving,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun LabeledField(label: String, value: String, onChange: (String) -> Unit, hint: String) {
    AppFormField(label = label, value = value, onValueChange = onChange)
    Spacer(Modifier.height(Tokens.Space.xs))
    Text(hint, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
}

/** Maps a device-model 409 to the i18n key of the field that collided. */
private fun conflictKey(e: AppException): String? {
    if (e.statusCode != 409) return null
    val msg = e.message?.lowercase() ?: ""
    return when {
        "kind" in msg -> "catalog.kindLocked"
        "barcode" in msg -> "catalog.errorBarcodeExists"
        else -> "inventory.modelDuplicate"
    }
}
