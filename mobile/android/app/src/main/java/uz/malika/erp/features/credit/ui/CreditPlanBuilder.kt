package uz.malika.erp.features.credit.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.credit.lib.CreditPlan
import uz.malika.erp.features.credit.model.CreditDraft
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens

/**
 * The payment-plan builder (ADR 0035): parts + first due + frequency feed "split
 * evenly", then rows the seller may edit by hand. "Left to plan" must reach zero
 * (cart total − down payment − Σ parts). No interest/fee field exists here.
 */
@Composable
fun CreditPlanBuilder(draft: CreditDraft, downPaymentCents: Long, enabled: Boolean) {
    val t = LocalT.current
    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
        Text(t("credit.plan", null), style = MaterialTheme.typography.titleSmall, color = Tokens.text)

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(Tokens.Space.sm), verticalAlignment = Alignment.Bottom) {
            AppFormField(
                label = t("credit.parts", null),
                value = draft.partsText,
                onValueChange = { draft.partsText = it },
                keyboardType = KeyboardType.Number,
                enabled = enabled,
                modifier = Modifier.width(96.dp),
            )
            PlanDateField(t("credit.firstDue", null), draft.firstDue, { draft.firstDue = it }, Modifier.weight(1f))
        }
        SegmentedControl(
            options = listOf(
                SegmentOption(CreditPlan.Frequency.MONTH, t("credit.everyMonth", null)),
                SegmentOption(CreditPlan.Frequency.WEEK, t("credit.everyWeek", null)),
            ),
            selected = draft.frequency,
            onSelect = { if (enabled) draft.frequency = it },
        )
        PillButton(
            text = t("credit.evenSplit", null),
            onClick = { draft.applyEven(downPaymentCents) },
            variant = ButtonVariant.OUTLINE,
            enabled = enabled,
            modifier = Modifier.fillMaxWidth(),
        )

        draft.rows.forEachIndexed { i, row ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(Tokens.Space.sm), verticalAlignment = Alignment.Bottom) {
                AppFormField(
                    label = t("credit.instalment", mapOf("n" to (i + 1))),
                    value = row.amount,
                    onValueChange = { draft.setAmount(row.id, it) },
                    keyboardType = KeyboardType.Decimal,
                    enabled = enabled,
                    modifier = Modifier.weight(1f),
                )
                PlanDateField("", row.dueDate, { draft.setDue(row.id, it) }, Modifier.weight(1f))
            }
            if (draft.rows.size > 1) {
                PillButton(t("credit.removeInstalment", null), { draft.remove(row.id) }, variant = ButtonVariant.GHOST, enabled = enabled)
            }
        }
        PillButton(t("credit.addInstalment", null), { draft.add() }, variant = ButtonVariant.GHOST, enabled = enabled, modifier = Modifier.fillMaxWidth())

        val remaining = draft.remainingCents(downPaymentCents)
        val settled = remaining == 0L
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(t("credit.planRemaining", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
            MoneyText(
                CreditPlan.fromCents(remaining).toPlainString(),
                style = MaterialTheme.typography.bodyMedium.copy(color = if (settled) Tokens.success else Tokens.danger),
            )
        }
    }
}
