import Foundation

extension KeyedDecodingContainer {
    /// Money/decimal fields arrive as a JSON string or a number depending on the
    /// endpoint; normalize to a Decimal string (nil when absent — cost-redacted).
    /// `MoneyText` renders it; never parse money as a Double for display.
    func decimalString(_ key: Key) -> String? {
        if let s = try? decodeIfPresent(String.self, forKey: key) { return s }
        if let n = try? decodeIfPresent(Double.self, forKey: key) { return String(n) }
        return nil
    }
}
