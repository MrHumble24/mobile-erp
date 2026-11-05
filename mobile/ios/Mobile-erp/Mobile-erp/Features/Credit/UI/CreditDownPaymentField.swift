import SwiftUI

/// The down payment on a credit (ADR 0035): an amount taken now and how it is
/// tendered (cash / card / split). May be zero. The split rows must add up to the
/// typed amount, which `PaymentMethodField` shows live.
struct CreditDownPaymentField: View {
    @Bindable var draft: CreditDraft
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                Text(i18n.t("credit.downPayment")).font(.ui(.heading)).foregroundStyle(Tokens.text)
                AppTextField(placeholder: "0", text: $draft.downPayment,
                             keyboard: .decimalPad, font: .data(.regular))
                    .sanitizeDecimal($draft.downPayment)
                AppFormField(label: i18n.t("balance.paidWith")) {
                    PaymentMethodField(selection: draft.payment, total: draft.downPaymentDecimal)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
