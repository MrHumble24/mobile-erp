package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.sales.data.CustomerBonusDto
import uz.malika.erp.features.sales.model.CustomerBonusState
import uz.malika.erp.features.sales.data.CustomersRepository
import uz.malika.erp.features.sales.data.SalesApi
import uz.malika.erp.features.sales.model.CustomerBonusViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.i18n.Translate
import uz.malika.erp.shared.lib.formatDate
import uz.malika.erp.shared.lib.formatPoints
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.FactRow
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * A customer's bonus points: balance and history. Renders nothing while offline,
 * while the load fails, or while the store has bonus disabled (ADR 0043).
 */
@Composable
fun CustomerBonusSection(container: AppContainer, customerId: String) {
    val t = LocalT.current
    val online by container.connectivity.online.collectAsState()
    val canAdjust = LocalCan.current("bonus.adjust")
    var openAdjust by remember { mutableStateOf(false) }
    val vm: CustomerBonusViewModel = viewModel(
        key = customerId,
        factory = viewModelFactory {
            initializer {
                CustomerBonusViewModel(
                    CustomersRepository(container.retrofit.create(SalesApi::class.java)),
                    customerId,
                )
            }
        },
    )
    val state by vm.state.collectAsState()
    LaunchedEffect(customerId) { vm.load() }
    val current = state

    val dto: CustomerBonusDto? = when (current) {
        is CustomerBonusState.Ok -> current.dto
        else -> null
    }
    if (dto == null || !online || !dto.enabled) return

    Column(Modifier.fillMaxWidth()) {
        Text(t("customers.bonusTitle", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.sm))
        FactRow(t("customers.bonusBalance", null)) {
            Text(
                formatPoints(dto.balance),
                style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily),
                color = Tokens.text,
            )
        }
        Spacer(Modifier.height(Tokens.Space.lg))
        Text(t("customers.bonusHistory", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.sm))
        if (dto.history.isEmpty()) {
            Text(t("customers.bonusEmptyHistory", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
        } else {
            dto.history.forEach { row ->
                BonusHistoryRow(t, row)
                Spacer(Modifier.height(Tokens.Space.sm))
            }
            if (canAdjust) {
                Spacer(Modifier.height(Tokens.Space.lg))
                PillButton(
                    text = t("customers.bonusCorrect", null),
                    onClick = { openAdjust = true },
                    variant = ButtonVariant.OUTLINE,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }

    if (openAdjust) {
        AdjustBonusSheet(
            container = container,
            customerId = customerId,
            vm = vm,
            onDismiss = { openAdjust = false },
            onApplied = { vm.load() },
        )
    }
}

@Composable
private fun BonusHistoryRow(t: Translate, row: uz.malika.erp.features.sales.data.BonusHistoryRowDto) {
    Row(
        Modifier.fillMaxWidth(),
        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text(bonusTypeLabel(t, row.typeCode), style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
            row.occurredAt?.let {
                Text(formatDate(it), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            }
            row.note?.takeIf { it.isNotBlank() }?.let {
                Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            }
            row.createdBy?.name?.takeIf { it.isNotBlank() }?.let { name ->
                Text("${t("customers.bonusBy", null)} $name", style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            }
        }
        Text(signedPoints(row.amount), style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.text)
    }
}

private fun bonusTypeLabel(t: Translate, code: String): String =
    when (code) {
        "EARN" -> t("customers.bonusTypeEarn", null)
        "SPEND" -> t("customers.bonusTypeSpend", null)
        "RETURN" -> t("customers.bonusTypeReturn", null)
        "CORRECTION" -> t("customers.bonusTypeCorrection", null)
        else -> code
}

/** `+` in front of a positive amount; negatives already carry their sign. */
private fun signedPoints(amount: String): String {
    val formatted = formatPoints(amount)
    return if (formatted.startsWith("-")) formatted else "+$formatted"
}
