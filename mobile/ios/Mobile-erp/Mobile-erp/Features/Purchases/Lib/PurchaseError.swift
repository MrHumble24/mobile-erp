import Foundation

/// Map a `POST /customer-purchases` failure to a `purchases.*` i18n key (ADR
/// 0039). A duplicate IMEI/serial is a 409; anything else returns nil so the
/// caller shows the raw server message.
enum PurchaseError {
    static func key(_ error: AppError) -> String? {
        if error.statusCode == 409 { return "purchases.buyConflict" }
        return nil
    }

    static func message(_ error: AppError, _ i18n: I18n) -> String {
        if let k = key(error) { return i18n.t(k) }
        return error.message
    }
}
