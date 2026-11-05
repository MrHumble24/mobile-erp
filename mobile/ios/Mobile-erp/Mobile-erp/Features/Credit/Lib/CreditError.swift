import Foundation

/// Map a `POST /credits` failure to a `credit.*` i18n key (ADR 0035). The server
/// raises distinct 400 messages; we key off their stable fragments. Anything else
/// returns nil so the caller shows the raw message.
enum CreditError {
    static func key(_ error: AppError) -> String? {
        guard error.statusCode == 400 else { return nil }
        let m = error.message.lowercased()
        if m.contains("cart total") || m.contains("add up") { return "credit.errorPlanTotal" }
        if m.contains("past") { return "credit.errorPastDue" }
        if m.contains("limit") { return "credit.errorLimit" }
        if m.contains("disabled") || m.contains("switched off") || m.contains("turned off") {
            return "credit.errorDisabled"
        }
        if m.contains("phone") { return "credit.needsCustomer" }
        return nil
    }

    /// The readable message for a credit failure: the mapped key, else the raw.
    static func message(_ error: AppError, _ i18n: I18n) -> String {
        if let k = key(error) { return i18n.t(k) }
        return error.message
    }
}
