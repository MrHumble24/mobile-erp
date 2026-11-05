package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.sales.model.SalesViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.ScannerField
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/** Scan an IMEI → warranty status + a return action. Works offline from the device cache. */
@Composable
fun WarrantyPanel(vm: SalesViewModel, online: Boolean, onReturn: (saleId: String) -> Unit) {
    val t = LocalT.current
    val ui by vm.warranty.collectAsState()
    Column(Modifier.fillMaxSize()) {
        Text(t("sales.warrantyLookup", null), style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(12.dp))
        ScannerField(onScan = { code, _ -> vm.lookupWarranty(code, online) }, placeholder = t("sales.imeiPlaceholder", null))
        Spacer(Modifier.height(16.dp))
        Box(Modifier.fillMaxSize()) {
            when {
                ui.loading -> Loading()
                ui.searched && ui.result == null -> EmptyView(t("common.notFound", null), icon = Icons.Outlined.VerifiedUser)
                ui.result == null -> EmptyView(t("sales.warrantyLookup", null), icon = Icons.Outlined.VerifiedUser)
                else -> {
                    val w = ui.result!!
                    AppCard(Modifier.fillMaxWidth()) {
                        Text(w.code, style = MaterialTheme.typography.titleMedium)
                        Spacer(Modifier.height(8.dp))
                        StatusChip(
                            if (w.active) t("sales.warrantyValid", null) else t("sales.warrantyExpired", null),
                            color = if (w.active) Tokens.success else Tokens.danger,
                        )
                        Spacer(Modifier.height(12.dp))
                        Kv(t("sales.salePrice", null), formatMoney(w.salePrice))
                        Kv(t("sales.remainingDays", null), w.remainingDays.toString())
                        w.grade?.let { Kv("QC", it) }
                        Spacer(Modifier.height(16.dp))
                        if (w.alreadyReturned) {
                            Text(t("sales.alreadyReturned", null), color = Tokens.danger, style = MaterialTheme.typography.bodyMedium)
                        } else {
                            PillButton(t("sales.returnDevice", null), { onReturn(w.saleId) }, Modifier.fillMaxWidth())
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun Kv(label: String, value: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium)
        Text(value, style = MaterialTheme.typography.bodyMedium)
    }
}
