import Foundation

/// A cash/card account the user can pick when money moves. Code is the stable
/// ledger account code (`CASH`, `CARD`, …); `label` is already localized.
struct PaymentAccount: Identifiable, Equatable {
    let code: String
    let label: String
    var id: String { code }
}

/// One source of truth for naming and listing payment accounts across every
/// money screen (POS, expenses, partner payments, shipments). Options come from
/// `GET /ledger/balances` when the user has `balance.read`; cashiers don't, so
/// they fall back to the two known codes `CASH` and `CARD`.
enum PaymentAccounts {
    static let cash = "CASH"
    static let card = "CARD"

    /// i18n key for a known account code, or nil for an unknown one.
    static func labelKey(_ code: String) -> String? {
        switch code {
        case cash: "balance.accountCash"
        case card: "balance.accountCard"
        default: nil
        }
    }

    /// Localized label for an account code; falls back to a server-sent label,
    /// then the raw code.
    static func label(_ code: String, server: String? = nil, _ i18n: I18n) -> String {
        if let key = labelKey(code) { return i18n.t(key) }
        return server ?? code
    }

    /// Account options for a picker. The balances call is best-effort: on any
    /// failure (or no permission) the two known codes are returned so the picker
    /// is never empty.
    @MainActor
    static func load(api: APIClient, canReadBalances: Bool, i18n: I18n) async -> [PaymentAccount] {
        if canReadBalances, let summary: BalancesAccounts = try? await api.get("/ledger/balances") {
            let options = summary.accounts.map {
                PaymentAccount(code: $0.accountCode, label: label($0.accountCode, server: $0.label, i18n))
            }
            if !options.isEmpty { return options }
        }
        return [cash, card].map { PaymentAccount(code: $0, label: label($0, i18n)) }
    }
}

/// Minimal decode of `/ledger/balances` for the picker — only the codes/labels,
/// not the running totals the balance screen needs.
private struct BalancesAccounts: Decodable {
    struct Account: Decodable { let accountCode: String; let label: String? }
    let accounts: [Account]
}
