package uz.malika.erp.features.balance.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import uz.malika.erp.features.balance.data.CreateLedgerTxnBody
import uz.malika.erp.features.balance.data.CreateTransferBody
import uz.malika.erp.features.balance.data.LedgerAccount
import uz.malika.erp.features.balance.model.BalanceViewModel
import uz.malika.erp.features.balance.model.EntryCheck
import uz.malika.erp.features.balance.model.LedgerAction
import uz.malika.erp.features.balance.model.TransferCheck
import uz.malika.erp.features.balance.model.checkEntry
import uz.malika.erp.features.balance.model.checkTransfer
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.AppSelect
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/** Pick which manual entry to add — one sheet, each row opens the matching form. */
@Composable
fun EntryActionSheet(onPick: (LedgerAction) -> Unit, onTransfer: () -> Unit, onDismiss: () -> Unit) {
    val t = LocalT.current
    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().padding(Tokens.Space.gutter),
            verticalArrangement = Arrangement.spacedBy(Tokens.Space.sm),
        ) {
            Text(t("balance.newEntry", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            val action = ButtonVariant.SECONDARY
            PillButton(t("balance.setOpening", null), { onPick(LedgerAction.OPENING) }, Modifier.fillMaxWidth(), variant = action)
            PillButton(t("balance.deposit", null), { onPick(LedgerAction.DEPOSIT) }, Modifier.fillMaxWidth(), variant = action)
            PillButton(t("balance.withdraw", null), { onPick(LedgerAction.WITHDRAWAL) }, Modifier.fillMaxWidth(), variant = action)
            PillButton(t("balance.correction", null), { onPick(LedgerAction.CORRECTION) }, Modifier.fillMaxWidth(), variant = action)
            PillButton(t("balance.transfer", null), { onTransfer() }, Modifier.fillMaxWidth(), variant = action)
        }
    }
}

private fun actionTitleKey(action: LedgerAction): String = when (action) {
    LedgerAction.OPENING -> "balance.setOpening"
    LedgerAction.DEPOSIT -> "balance.deposit"
    LedgerAction.WITHDRAWAL -> "balance.withdraw"
    LedgerAction.CORRECTION -> "balance.correction"
}

/**
 * The manual-entry form for deposit / withdraw / starting balance / correction.
 * Sign and reason rules live in [checkEntry]; the hint tells the user a minus
 * takes money out for the signed actions. Online-only (the ViewModel refuses a
 * write while offline) and closes on success.
 */
@Composable
fun LedgerEntrySheet(
    action: LedgerAction,
    accounts: List<LedgerAccount>,
    vm: BalanceViewModel,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    var accountCode by remember { mutableStateOf(accounts.firstOrNull()?.accountCode) }
    var amount by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    var amountError by remember { mutableStateOf<String?>(null) }
    var noteError by remember { mutableStateOf<String?>(null) }

    fun submit() {
        when (val check = checkEntry(action, amount, note)) {
            is EntryCheck.Error -> {
                amountError = check.key.takeIf { it == "balance.errorAmountRequired" }?.let { t(it, null) }
                noteError = check.key.takeIf { it == "balance.errorReasonRequired" }?.let { t(it, null) }
            }
            is EntryCheck.Ok -> {
                val code = accountCode ?: return
                vm.createEntry(
                    CreateLedgerTxnBody(code, action.typeCode, check.amount, note.trim().ifBlank { null }),
                    onDismiss,
                )
            }
        }
    }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter),
            verticalArrangement = Arrangement.spacedBy(Tokens.Space.md),
        ) {
            Text(t(actionTitleKey(action), null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            AppSelect(
                value = accountCode,
                options = accounts.map { it.accountCode },
                optionLabel = { accountLabel(it, accounts, t) },
                onSelect = { accountCode = it },
                label = t("balance.filterAccount", null),
            )
            AppFormField(
                label = t("balance.amount", null),
                value = amount,
                onValueChange = { amount = it; amountError = null },
                keyboardType = KeyboardType.Decimal,
                error = amountError,
            )
            if (action.signed) {
                Text(
                    t(if (action == LedgerAction.OPENING) "balance.openingHint" else "balance.correctionHint", null),
                    style = MaterialTheme.typography.bodySmall,
                    color = Tokens.muted,
                )
            }
            AppFormField(
                label = t(if (action.needsReason) "balance.reason" else "balance.note", null),
                value = note,
                onValueChange = { note = it; noteError = null },
                error = noteError,
            )
            PillButton(t("common.save", null), ::submit, Modifier.fillMaxWidth())
        }
    }
}

/**
 * Transfer between two accounts. [checkTransfer] enforces a positive amount and
 * two different accounts; the error shows below the fields. Online-only.
 */
@Composable
fun TransferSheet(accounts: List<LedgerAccount>, vm: BalanceViewModel, onDismiss: () -> Unit) {
    val t = LocalT.current
    var from by remember { mutableStateOf(accounts.firstOrNull()?.accountCode) }
    var to by remember { mutableStateOf(accounts.getOrNull(1)?.accountCode) }
    var amount by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    fun submit() {
        when (val check = checkTransfer(from, to, amount)) {
            is TransferCheck.Error -> error = t(check.key, null)
            is TransferCheck.Ok -> vm.transfer(
                CreateTransferBody(from!!, to!!, check.amount, note.trim().ifBlank { null }),
                onDismiss,
            )
        }
    }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter),
            verticalArrangement = Arrangement.spacedBy(Tokens.Space.md),
        ) {
            Text(t("balance.transfer", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            AppSelect(
                value = from,
                options = accounts.map { it.accountCode },
                optionLabel = { accountLabel(it, accounts, t) },
                onSelect = { from = it; error = null },
                label = t("balance.fromAccount", null),
            )
            AppSelect(
                value = to,
                options = accounts.map { it.accountCode },
                optionLabel = { accountLabel(it, accounts, t) },
                onSelect = { to = it; error = null },
                label = t("balance.toAccount", null),
            )
            AppFormField(
                label = t("balance.amount", null),
                value = amount,
                onValueChange = { amount = it; error = null },
                keyboardType = KeyboardType.Decimal,
            )
            AppFormField(
                label = t("balance.note", null),
                value = note,
                onValueChange = { note = it },
            )
            error?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger) }
            PillButton(t("common.save", null), ::submit, Modifier.fillMaxWidth())
        }
    }
}
