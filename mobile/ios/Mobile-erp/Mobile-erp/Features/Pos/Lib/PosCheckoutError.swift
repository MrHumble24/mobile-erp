import Foundation

/// Pure mapping from server refusal codes to client error keys (ADR 0047).
enum PosCheckoutError {
    private static let errorKeys: [String: String] = [
        "BONUS_DISABLED": "pos.bonusErrorDisabled",
        "BONUS_NO_CUSTOMER": "pos.bonusErrorNoCustomer",
        "BONUS_REDEEM_EXCEEDS_BALANCE": "pos.bonusErrorExceedsBalance",
        "BONUS_REDEEM_EXCEEDS_MAX": "pos.bonusErrorExceedsMax",
        "BONUS_REDEEM_EXCEEDS_DUE": "pos.bonusErrorExceedsDue",
        "BONUS_REDEEM_OFFLINE": "pos.bonusErrorOffline",
        "TRADE_IN_FORBIDDEN": "pos.tradeInErrorForbidden",
        "TRADE_IN_NO_CUSTOMER": "pos.tradeInErrorNoCustomer",
        "TRADE_IN_OFFLINE": "pos.tradeInErrorOffline",
        "TRADE_IN_EXCEEDS_SALE": "pos.tradeInErrorExceedsSale",
        "PURCHASE_UNIT_EXISTS": "purchases.buyNotSold",
    ]

    /// Key for a known refusal code, or nil if unknown.
    static func key(for code: String?) -> String? {
        guard let code else { return nil }
        return errorKeys[code]
    }

    /// Resolves a refusal code to a localized key or falls back to the server message.
    static func resolve(code: String?, serverMessage: String) -> String {
        guard let code, let key = errorKeys[code] else { return serverMessage }
        return key
    }
}
