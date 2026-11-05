import SwiftUI

/// Maps ledger account & type codes to the web i18n `balance` namespace keys,
/// and tints money by sign. An unknown code falls back to the server-sent label
/// (then the raw code). Pure — covered by `BalanceSelfCheck`.
enum BalanceFormat {
    static func accountKey(_ code: String) -> String? {
        switch code {
        case "CASH": "balance.accountCash"
        case "CARD": "balance.accountCard"
        default: nil
        }
    }

    static func typeKey(_ code: String) -> String? {
        switch code {
        case "OPENING": "balance.typeOpening"
        case "DEPOSIT": "balance.typeDeposit"
        case "WITHDRAWAL": "balance.typeWithdrawal"
        case "CORRECTION": "balance.typeCorrection"
        case "TRANSFER": "balance.typeTransfer"
        case "SALE": "balance.typeSale"
        case "REFUND": "balance.typeRefund"
        case "PARTNER_PAYMENT": "balance.typePartnerPayment"
        case "PURCHASE": "balance.typePurchase"
        case "OVERHEAD": "balance.typeOverhead"
        case "EXPENSE": "balance.typeExpense"
        default: nil
        }
    }

    /// Known type codes for the filter dropdown, in display order.
    static let allTypeCodes = [
        "OPENING", "DEPOSIT", "WITHDRAWAL", "CORRECTION", "TRANSFER",
        "SALE", "REFUND", "PARTNER_PAYMENT", "PURCHASE", "OVERHEAD", "EXPENSE",
    ]

    static func account(_ code: String, label: String?, _ i18n: I18n) -> String {
        if let key = accountKey(code) { return i18n.t(key) }
        return label ?? code
    }

    static func type(_ code: String, label: String?, _ i18n: I18n) -> String {
        if let key = typeKey(code) { return i18n.t(key) }
        return label ?? code
    }

    /// Account/total tint: below zero is danger, otherwise neutral text.
    static func balanceTint(_ value: String) -> Color {
        (Decimal(string: value) ?? 0) < 0 ? Tokens.danger : Tokens.text
    }

    /// History amount tint by sign: negative danger, positive success, zero text.
    static func amountTint(_ value: String) -> Color {
        let d = Decimal(string: value) ?? 0
        if d < 0 { return Tokens.danger }
        if d > 0 { return Tokens.success }
        return Tokens.text
    }
}
