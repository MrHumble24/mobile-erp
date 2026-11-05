import SwiftUI

/// Take a payment on a credit, or pay back an overpayment (ADR 0035). One amount
/// and a cash/card account. A payment above what is left is refused by the server
/// (400 → `credit.errorAboveOutstanding`); a refund caps at the overpaid amount.
/// Online only.
struct CreditPaymentSheet: View {
    enum Mode { case payment, refund }

    let creditId: String
    let mode: Mode
    /// The refund ceiling (overpaid amount); nil for a payment.
    let maxAmount: Decimal?
    let onDone: (CreditView) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var amount = ""
    @State private var account = PaymentAccounts.cash
    @State private var accounts: [PaymentAccount] = []
    @State private var busy = false
    @State private var error: String?

    private var entered: Decimal { Decimal(string: amount.trimmingCharacters(in: .whitespaces)) ?? .zero }
    private var overLimit: Bool { maxAmount.map { entered > $0 } ?? false }
    private var valid: Bool { entered > 0 && !overLimit }
    private var title: String { mode == .refund ? i18n.t("credit.refundOverpayment") : i18n.t("credit.takePayment") }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: title) { dismiss() }
                if !container.connectivity.isOnline {
                    FormErrorLine(message: i18n.t("credit.errorOffline"), color: Tokens.warning)
                }
                AppFormField(label: i18n.t("credit.amount")) {
                    AppTextField(placeholder: "0", text: $amount, keyboard: .decimalPad, font: .data(.regular))
                        .sanitizeDecimal($amount)
                    if let maxAmount, mode == .refund {
                        Text("\(i18n.t("credit.overpaid")): \(MoneyText.format(NSDecimalNumber(decimal: maxAmount).stringValue))")
                            .font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    }
                }
                AppFormField(label: i18n.t("balance.paidWith")) {
                    AccountPicker(accounts: accounts, selection: $account)
                }
                if overLimit { FormErrorLine(message: i18n.t("credit.errorAboveOutstanding")) }
                if let error { FormErrorLine(message: error) }
                Button(action: submit) {
                    if busy { ProgressView().tint(Tokens.onAction).frame(maxWidth: .infinity) }
                    else { Text(i18n.t(mode == .refund ? "credit.refundOverpayment" : "credit.takePayment")).frame(maxWidth: .infinity) }
                }
                .buttonStyle(.pillPrimary)
                .disabled(busy || !valid || !container.connectivity.isOnline)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.medium, .large])
        .task { if accounts.isEmpty { accounts = await PaymentAccounts.load(api: container.api, i18n: i18n) } }
    }

    private func submit() {
        guard valid, !busy, container.connectivity.isOnline else { return }
        busy = true
        error = nil
        let payload = CreditPaymentPayload(amount: NSDecimalNumber(decimal: entered).doubleValue, accountCode: account)
        let repo = CreditRepository(container)
        Task {
            do {
                let updated = mode == .refund
                    ? try await repo.refund(creditId, payload)
                    : try await repo.addPayment(creditId, payload)
                busy = false
                container.toasts.success(i18n.t(mode == .refund ? "credit.refundSaved" : "credit.paymentSaved"))
                onDone(updated)
                dismiss()
            } catch let e as AppError {
                busy = false
                error = e.statusCode == 400 ? i18n.t("credit.errorAboveOutstanding") : e.message
            } catch {
                busy = false
                self.error = error.localizedDescription
            }
        }
    }
}
