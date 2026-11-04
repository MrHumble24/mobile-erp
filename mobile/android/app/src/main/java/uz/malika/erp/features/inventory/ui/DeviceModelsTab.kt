package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import uz.malika.erp.features.inventory.data.DeviceModelView
import uz.malika.erp.features.inventory.model.Async
import uz.malika.erp.features.inventory.model.CatalogViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.listBottomPadding
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppTextField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/** Models tab: searchable model list with create / edit (needs `device.update`). */
@Composable
fun DeviceModelsTab(catalogVm: CatalogViewModel, online: Boolean) {
    val t = LocalT.current
    val state by catalogVm.models.collectAsState()
    var query by remember { mutableStateOf("") }
    var editing by remember { mutableStateOf<DeviceModelView?>(null) }
    var creating by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxSize().padding(horizontal = Tokens.Space.screenH)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            AppTextField(
                value = query,
                onValueChange = { query = it },
                placeholder = "${t("inventory.brand", null)} / ${t("inventory.model", null)}...",
                modifier = Modifier.weight(1f),
            )
            Spacer(Modifier.width(Tokens.Space.gap))
            PillButton(text = t("inventory.newModel", null), onClick = { creating = true })
        }
        Spacer(Modifier.height(Tokens.Space.md))
        Box(Modifier.weight(1f).fillMaxWidth()) {
            when (val s = state) {
                is Async.Loading -> Loading()
                is Async.Error -> ErrorView(message = s.message, retryLabel = t("common.retry", null), onRetry = catalogVm::refresh)
                is Async.Data -> {
                    val list = s.value.filter { it.label.lowercase().contains(query.trim().lowercase()) }
                    if (list.isEmpty()) {
                        EmptyView(message = t("inventory.empty", null))
                    } else {
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg), contentPadding = listBottomPadding()) {
                            items(list, key = { it.id }) { m -> ModelRow(m) { editing = m } }
                        }
                    }
                }
            }
        }
    }

    if (creating) {
        AppBottomSheet(onDismiss = { creating = false }) {
            ModelFormSheet(model = null, catalogVm = catalogVm, online = online, onSaved = { creating = false })
        }
    }
    editing?.let { model ->
        AppBottomSheet(onDismiss = { editing = null }) {
            ModelFormSheet(model = model, catalogVm = catalogVm, online = online, onSaved = { editing = null })
        }
    }
}

@Composable
private fun ModelRow(model: DeviceModelView, onClick: () -> Unit) {
    val t = LocalT.current
    AppCard(onClick = onClick) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(model.label, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                Text(
                    "${model.attributes.size} ${t("inventory.attrSectionTitle", null).lowercase()}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Tokens.muted,
                )
            }
            Spacer(Modifier.width(Tokens.Space.gap))
            StatusChip(
                label = if (model.isActive) t("inventory.modelActive", null) else t("common.no", null),
                color = if (model.isActive) Tokens.success else Tokens.sold,
            )
        }
    }
}
