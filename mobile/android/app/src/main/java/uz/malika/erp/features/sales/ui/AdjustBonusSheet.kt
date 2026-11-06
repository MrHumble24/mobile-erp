package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Column
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.AppContainer
import uz.malika.erp.features.sales.model.CustomerBonusViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.features.sales.lib.adjustBonusError
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/**
 * Manual bonus-point correction sheet (`bonus.adjust`, online only). On success
 * toasts and closes; the view model already holds the new balance and row. A
 * server refusal shows its message in the sheet and keeps what was typed.
 */
@Composable
fun AdjustBonusSheet(
    container: AppContainer,
    customerId: String,
    vm: CustomerBonusViewModel,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    val online by container.connectivity.online.collectAsState()
    var amount by remember { mutableStateOf("") }
    var reason by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
                .verticalScroll(rememberScrollState()),
        ) {
            Text(t("customers.bonusAdjustTitle", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
            Spacer(Modifier.height(Tokens.Space.sm))
            Text(t("customers.bonusAdjustHint", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            Spacer(Modifier.height(Tokens.Space.md))
            AppFormField(
                label = t("customers.bonusAmount", null),
                value = amount,
                onValueChange = { amount = it; error = null },
                keyboardType = KeyboardType.Text,
                placeholder = t("customers.bonusAmountPlaceholder", null),
            )
            Spacer(Modifier.height(Tokens.Space.md))
            AppFormField(
                label = t("customers.bonusReason", null),
                value = reason,
                onValueChange = { reason = it; error = null },
                placeholder = t("customers.bonusReasonPlaceholder", null),
            )
            error?.let {
                Spacer(Modifier.height(4.dp))
                Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
            }
            Spacer(Modifier.height(Tokens.Space.lg))
            PillButton(
                text = t("customers.bonusApply", null),
                onClick = {
                    error = null
                    val key = adjustBonusError(amount, reason)
                    if (key == null) {
                        busy = true
                        scope.launch {
                            val refusal = vm.adjust(amount.trim().toDouble(), reason.trim())
                            busy = false
                            if (refusal == null) {
                                container.toaster.success(t("customers.bonusAdjusted", null))
                                onDismiss()
                            } else {
                                error = t(refusal, null)
                            }
                        }
                    } else {
                        error = t(key, null)
                    }
                },
                enabled = online && !busy,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
