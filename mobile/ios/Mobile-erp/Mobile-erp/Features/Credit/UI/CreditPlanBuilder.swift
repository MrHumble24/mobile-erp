import SwiftUI

/// The payment plan builder (ADR 0035): number of parts, first due date, every
/// month / week, a "split evenly" button, then editable rows. "Left to plan"
/// turns red until it is zero, which is when the till lets the sale through.
struct CreditPlanBuilder: View {
    @Bindable var draft: CreditDraft
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                Text(i18n.t("credit.plan")).font(.ui(.heading)).foregroundStyle(Tokens.text)
                evenControls
                Divider().overlay(Tokens.border)
                rows
                Button { draft.addInstalment() } label: {
                    Label(i18n.t("credit.addInstalment"), systemImage: "plus").frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillGhost)
                remainingRow
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var evenControls: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.sm) {
            HStack(spacing: Tokens.Space.sm) {
                AppFormField(label: i18n.t("credit.parts")) {
                    Stepper(value: $draft.parts, in: 1...60) {
                        Text("\(draft.parts)").font(.data(.regular)).foregroundStyle(Tokens.text)
                    }
                }
            }
            AppFormField(label: i18n.t("credit.firstDue")) {
                AppDateField(date: $draft.firstDue)
            }
            SegmentedControl(selection: $draft.frequency, segments: [
                (.month, i18n.t("credit.everyMonth")),
                (.week, i18n.t("credit.everyWeek")),
            ])
            Button { draft.applyEven() } label: {
                Label(i18n.t("credit.evenSplit"), systemImage: "equal.square").frame(maxWidth: .infinity)
            }
            .buttonStyle(.pillSecondary)
        }
    }

    private var rows: some View {
        VStack(spacing: Tokens.Space.md) {
            ForEach(Array(draft.instalments.enumerated()), id: \.element.id) { i, row in
                VStack(alignment: .leading, spacing: Tokens.Space.sm) {
                    HStack {
                        Text(i18n.t("credit.instalment", ["n": String(i + 1)]))
                            .font(.ui(.label)).foregroundStyle(Tokens.muted)
                        Spacer()
                        if draft.instalments.count > 1 {
                            Button(role: .destructive) { draft.removeInstalment(row.id) } label: {
                                Image(systemName: "trash").font(.system(size: 14, weight: .medium))
                            }
                            .buttonStyle(.plain)
                            .foregroundStyle(Tokens.danger)
                            .accessibilityLabel(i18n.t("credit.removeInstalment"))
                        }
                    }
                    AppDateField(date: Binding(get: { row.dueDate }, set: { draft.setDue(row.id, $0) }))
                    AppTextField(placeholder: "0",
                                 text: Binding(get: { row.amount }, set: { draft.setAmount(row.id, $0) }),
                                 keyboard: .decimalPad, font: .data(.regular))
                        .sanitizeDecimal(Binding(get: { row.amount }, set: { draft.setAmount(row.id, $0) }))
                }
            }
        }
    }

    private var remainingRow: some View {
        HStack {
            Text(i18n.t("credit.planRemaining")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
            Spacer(minLength: Tokens.Space.sm)
            MoneyText(value: NSDecimalNumber(decimal: draft.remaining).stringValue, size: 15)
                .fontWeight(.semibold)
                .foregroundStyle(draft.remainingCents == 0 ? Tokens.success : Tokens.danger)
        }
    }
}
