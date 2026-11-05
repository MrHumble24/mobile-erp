package uz.malika.erp.features.balance.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.balance.data.LedgerTxn
import uz.malika.erp.features.balance.model.ledgerAccountKey
import uz.malika.erp.features.balance.model.ledgerTypeKey
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatDate
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.signTint
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * One history entry: type heading, account + date, optional note and author on
 * the left; the signed amount (mono, tinted by sign) on the right. Codes map to
 * i18n keys, falling back to the server label for an unknown code.
 */
@Composable
fun LedgerRow(txn: LedgerTxn, modifier: Modifier = Modifier) {
    val t = LocalT.current
    val typeLabel = ledgerTypeKey(txn.typeCode)?.let { t(it, null) } ?: txn.type?.label?.ifBlank { null } ?: txn.typeCode
    val accountLabel = ledgerAccountKey(txn.accountCode)?.let { t(it, null) } ?: txn.account?.label?.ifBlank { null } ?: txn.accountCode

    AppCard(modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(typeLabel, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                Text(accountLabel, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
                Text(
                    formatDate(txn.occurredAt),
                    style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily),
                    color = Tokens.muted,
                )
                txn.note?.takeIf { it.isNotBlank() }?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
                }
                txn.createdBy?.displayName?.takeIf { it.isNotBlank() }?.let {
                    Text(it, style = MaterialTheme.typography.labelSmall, color = Tokens.muted)
                }
            }
            Spacer(Modifier.width(Tokens.Space.gap))
            MoneyText(txn.amount, style = MaterialTheme.typography.titleSmall.copy(color = signTint(txn.amount)))
        }
    }
}
