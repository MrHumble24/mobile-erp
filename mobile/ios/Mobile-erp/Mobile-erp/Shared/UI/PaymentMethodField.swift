import SwiftUI
import Observation

/// How a sale is tendered: all cash, all card, or a split with one amount per
/// account. Shared state behind `PaymentMethodField`; the caller reads
/// `breakdown(total:)` to post and `isValid(total:)` to gate confirm.
@Observable
@MainActor
final class PaymentSelection {
    enum Method: String, CaseIterable { case cash, card, split }

    var method: Method = .cash
    private(set) var accounts: [PaymentAccount] = []
    /// Split entry: account code → amount string (bound to the fields).
    var splitAmounts: [String: String] = [:]

    func setAccounts(_ list: [PaymentAccount]) { accounts = list }

    /// Sum of the entered split amounts, exact (never via Double).
    func splitEntered() -> Decimal {
        accounts.reduce(.zero) { $0 + (Decimal(string: splitAmounts[$1.code] ?? "") ?? .zero) }
    }

    /// Still to assign for a split to balance; negative when over-assigned.
    func remaining(total: Decimal) -> Decimal { total - splitEntered() }

    /// Cart-level account breakdown for `total`. Empty = omit payments, which
    /// the server reads as one CASH payment of the whole price.
    func breakdown(total: Decimal) -> [(code: String, amount: Decimal)] {
        switch method {
        case .cash: []
        case .card: [(PaymentAccounts.card, total)]
        case .split:
            accounts.compactMap { acc in
                let amount = Decimal(string: splitAmounts[acc.code] ?? "") ?? .zero
                return amount > 0 ? (acc.code, amount) : nil
            }
        }
    }

    /// Whether checkout may proceed: cash/card always; a split must balance to
    /// a positive total exactly.
    func isValid(total: Decimal) -> Bool {
        switch method {
        case .cash, .card: true
        case .split: total > 0 && splitEntered() == total
        }
    }
}

/// The one payment-method control: a Cash / Card / Split segmented control and,
/// for a split, one amount field per account with a live "left to assign" line
/// that turns red until the parts add up to `total`.
struct PaymentMethodField: View {
    @Bindable var selection: PaymentSelection
    let total: Decimal
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.md) {
            SegmentedControl(selection: $selection.method, segments: [
                (.cash, i18n.t("balance.payCash")),
                (.card, i18n.t("balance.payCard")),
                (.split, i18n.t("balance.splitPayment")),
            ])
            if selection.method == .split { splitRows }
        }
    }

    private var splitRows: some View {
        VStack(spacing: Tokens.Space.sm) {
            ForEach(selection.accounts) { account in
                HStack(spacing: Tokens.Space.md) {
                    Text(account.label).font(.ui(.body)).foregroundStyle(Tokens.text)
                    Spacer(minLength: Tokens.Space.sm)
                    AppTextField(placeholder: "0", text: amountBinding(account.code),
                                 keyboard: .decimalPad, font: .data(.regular))
                        .sanitizeDecimal(amountBinding(account.code))
                        .frame(maxWidth: 160)
                }
            }
            remainingRow
        }
    }

    private var remainingRow: some View {
        let remaining = selection.remaining(total: total)
        return HStack {
            Text(i18n.t("balance.splitRemaining")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
            Spacer(minLength: Tokens.Space.sm)
            MoneyText(value: NSDecimalNumber(decimal: remaining).stringValue, size: 14)
                .fontWeight(.semibold)
                .foregroundStyle(remaining == 0 ? Tokens.success : Tokens.danger)
        }
        .padding(.top, 2)
    }

    private func amountBinding(_ code: String) -> Binding<String> {
        Binding(
            get: { selection.splitAmounts[code] ?? "" },
            set: { selection.splitAmounts[code] = $0 }
        )
    }
}
