package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.inventory.data.CategoryBody
import uz.malika.erp.features.inventory.data.ProductCategoryDto
import uz.malika.erp.features.inventory.model.CatalogViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.AppSwitch
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/**
 * Manage product categories (`/product-categories`): list, add, and edit each
 * (name, sort order, active). Online-only. A duplicate name surfaces
 * [catalog.errorCategoryExists] inline.
 */
@Composable
fun ProductCategoriesSheet(
    catalogVm: CatalogViewModel,
    categories: List<ProductCategoryDto>,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    var name by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var editing by remember { mutableStateOf<ProductCategoryDto?>(null) }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter),
            verticalArrangement = Arrangement.spacedBy(Tokens.Space.md),
        ) {
            Text(t("catalog.categories", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            Column {
                categories.forEachIndexed { i, category ->
                    Row(
                        Modifier.fillMaxWidth().heightIn(min = Tokens.minTouch).padding(vertical = Tokens.Space.xs),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(category.name, style = MaterialTheme.typography.bodyMedium, color = Tokens.text, modifier = Modifier.weight(1f))
                        if (!category.isActive) StatusChip(t("common.no", null), color = Tokens.sold)
                        PillButton(t("common.edit", null), onClick = { editing = category }, variant = ButtonVariant.GHOST)
                    }
                    if (i < categories.lastIndex) HorizontalDivider(color = Tokens.border)
                }
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(Tokens.Space.sm), verticalAlignment = Alignment.Bottom) {
                AppFormField(
                    label = t("catalog.newCategory", null),
                    value = name,
                    onValueChange = { name = it; error = null },
                    modifier = Modifier.weight(1f),
                )
                PillButton(t("common.add", null), onClick = {
                    if (name.isBlank()) return@PillButton
                    scope.launch {
                        try {
                            catalogVm.addCategory(name.trim()); name = ""; error = null
                        } catch (e: AppException) {
                            error = if (e.statusCode == 409) t("catalog.errorCategoryExists", null) else e.message
                        }
                    }
                })
            }
            error?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger) }
            Spacer(Modifier.height(Tokens.Space.sm))
        }
    }

    editing?.let { category ->
        EditProductCategorySheet(catalogVm, category) { editing = null }
    }
}

@Composable
private fun EditProductCategorySheet(
    catalogVm: CatalogViewModel,
    category: ProductCategoryDto,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    var name by remember { mutableStateOf(category.name) }
    var sortOrder by remember { mutableStateOf(category.sortOrder.toString()) }
    var active by remember { mutableStateOf(category.isActive) }
    var error by remember { mutableStateOf<String?>(null) }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter),
            verticalArrangement = Arrangement.spacedBy(Tokens.Space.md),
        ) {
            Text(t("catalog.editCategory", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            AppFormField(label = t("catalog.categoryName", null), value = name, onValueChange = { name = it; error = null })
            AppFormField(
                label = t("expenses.sortOrder", null),
                value = sortOrder,
                onValueChange = { sortOrder = it },
                keyboardType = androidx.compose.ui.text.input.KeyboardType.Number,
            )
            Row(Modifier.fillMaxWidth().heightIn(min = Tokens.minTouch), verticalAlignment = Alignment.CenterVertically) {
                Text(t("inventory.modelActive", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
                Spacer(Modifier.weight(1f))
                AppSwitch(checked = active, onCheckedChange = { active = it })
            }
            error?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger) }
            PillButton(t("common.save", null), onClick = {
                scope.launch {
                    try {
                        catalogVm.saveCategory(
                            category.id,
                            CategoryBody(name = name.trim().ifBlank { null }, sortOrder = sortOrder.trim().toIntOrNull(), isActive = active),
                        )
                        onDismiss()
                    } catch (e: AppException) {
                        error = if (e.statusCode == 409) t("catalog.errorCategoryExists", null) else e.message
                    }
                }
            }, modifier = Modifier.fillMaxWidth())
        }
    }
}
