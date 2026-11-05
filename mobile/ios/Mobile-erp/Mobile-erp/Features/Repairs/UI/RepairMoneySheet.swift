import SwiftUI

/// The three repair money actions (ADR 0040): take a customer payment, refund
/// one, or pay the outside master. One amount + account sheet; the endpoint is
/// chosen by `kind`. `NO_OPEN_SHIFT` (shifts on) maps to the shift prompt.
enum RepairMoneyKind { case payment, refund, outside }

struct RepairMoneySheet: View {
    let repairId: String
    let kind: RepairMoneyKind
    /// The outstanding / refundable ceiling shown as a hint (not hard-capped;
    /// the server is the source of truth).
    var hint: String?
    let onDone: (RepairView) -> Void
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var amount = ""
    @State private var accountCode = PaymentAccounts.cash
    @State private var accounts: [PaymentAccount] = []
    @State private var busy = false
    @State private var error: String?

    private var amountDecimal: Decimal { Decimal(string: amount.trimmingCharacters(in: .whitespaces)) ?? .zero }
    private var canSubmit: Bool { amountDecimal > 0 && !busy && container.connectivity.isOnline }

    private var title: String {
        switch kind {
        case .payment: i18n.t("repairs.takePayment", default: "Take payment")
        case .refund: i18n.t("repairs.refund", default: "Refund")
        case .outside: i18n.t("repairs.outsidePayment", default: "Pay outside master")
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: title) { dismiss() }
                if let hint { Text(hint).font(.ui(.caption)).foregroundStyle(Tokens.muted) }
                AppCard {
                    VStack(alignment: .leading, spacing: Tokens.Space.md) {
                        AppFormField(label: i18n.t("balance.amount", default: "Amount")) {
                            AppTextField(placeholder: "0", text: $amount, keyboard: .decimalPad, font: .mono(18, weight: .bold))
                                .sanitizeDecimal($amount)
                        }
                        AppFormField(label: i18n.t("balance.paidWith", default: "Account")) {
                            AccountPicker(accounts: accounts, selection: $accountCode)
                        }
                    }
                }
                if !container.connectivity.isOnline {
                    FormErrorLine(message: i18n.t("repairs.onlineOnly", default: "Repairs are available online only."))
                }
                if let error { FormErrorLine(message: error) }
                Button(action: submit) {
                    if busy { ProgressView().tint(Tokens.onAction).frame(maxWidth: .infinity) }
                    else { Text(title).frame(maxWidth: .infinity) }
                }
                .buttonStyle(.pillPrimary)
                .disabled(!canSubmit)
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
        guard canSubmit else { return }
        busy = true; error = nil
        Haptic.tick.play()
        let payload = RepairMoneyPayload(amount: NSDecimalNumber(decimal: amountDecimal).doubleValue, accountCode: accountCode)
        let repo = RepairsRepository(container)
        Task {
            do {
                let updated: RepairView
                switch kind {
                case .payment: updated = try await repo.payment(repairId, payload)
                case .refund: updated = try await repo.refund(repairId, payload)
                case .outside: updated = try await repo.outsidePayment(repairId, payload)
                }
                busy = false
                onDone(updated)
                dismiss()
            } catch let e as AppError { busy = false; error = RepairError.message(e, i18n) }
            catch { busy = false; self.error = error.localizedDescription }
        }
    }
}
