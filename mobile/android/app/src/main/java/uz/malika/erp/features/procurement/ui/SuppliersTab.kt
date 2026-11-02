package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.procurement.data.SupplierDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/** Suppliers CRUD list (a tab of the Shipments screen). */
@Composable
fun SuppliersTab(
    suppliers: List<SupplierDto>,
    canManage: Boolean,
    onNew: () -> Unit,
    onEdit: (SupplierDto) -> Unit,
) {
    val t = LocalT.current
    Column(Modifier.fillMaxWidth()) {
        if (canManage) {
            Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.End) {
                PillButton(t("shipments.newSupplier", null), onNew, variant = ButtonVariant.SECONDARY)
            }
        }
        if (suppliers.isEmpty()) {
            EmptyView(t("shipments.empty", null))
        } else {
            LazyColumn(
                contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(suppliers, key = { it.id }) { s ->
                    SupplierCard(s, canManage, onEdit)
                }
            }
        }
    }
}

@Composable
private fun SupplierCard(supplier: SupplierDto, canManage: Boolean, onEdit: (SupplierDto) -> Unit) {
    val t = LocalT.current
    val subtitle = listOfNotNull(supplier.country, supplier.contact).filter { it.isNotBlank() }.joinToString(" · ")
    AppCard(onClick = if (canManage) ({ onEdit(supplier) }) else null) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(supplier.name, style = MaterialTheme.typography.titleMedium)
                if (subtitle.isNotEmpty()) {
                    Spacer(Modifier.height(4.dp))
                    Text(subtitle, style = MaterialTheme.typography.bodySmall)
                }
            }
            StatusChip(
                label = t(if (supplier.isActive) "shipments.supplierActive" else "common.no", null),
                color = if (supplier.isActive) Tokens.success else Tokens.ash,
            )
            if (canManage) {
                Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = Tokens.ash)
            }
        }
    }
}
