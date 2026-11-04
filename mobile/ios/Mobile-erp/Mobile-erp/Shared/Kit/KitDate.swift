import Foundation

/// Display helpers for the ISO-8601 timestamps the server returns: `day`
/// (`yyyy-MM-dd`) and `dayTime` (`yyyy-MM-dd HH:mm`, device-local). Shared by
/// sales and inventory; `SaleDate` is a typealias onto this.
enum KitDate {
    /// Parse an ISO-8601 instant, with or without fractional seconds.
    static func parse(_ value: String?) -> Date? {
        guard let value else { return nil }
        let withFraction = ISO8601DateFormatter()
        withFraction.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = withFraction.date(from: value) { return d }
        return ISO8601DateFormatter().date(from: value)
    }

    static func day(_ iso: String?) -> String {
        guard let iso, let date = parse(iso) else { return "—" }
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }

    static func dayTime(_ iso: String?) -> String {
        guard let iso, let date = parse(iso) else { return "—" }
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd HH:mm"
        return f.string(from: date)
    }
}
