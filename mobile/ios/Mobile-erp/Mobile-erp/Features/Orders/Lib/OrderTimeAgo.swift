import Foundation

/// "How long ago" bucketing for an order's arrival time. Pure and testable; the
/// i18n key per bucket is chosen by the caller. Covered by `OrderRulesSelfCheck`.
enum OrderTimeAgo: Equatable {
    case justNow
    case minutes(Int)
    case hours(Int)
    case days(Int)

    /// Bucket from two epoch-second instants; a future timestamp clamps to now.
    static func bucket(createdAt: TimeInterval, now: TimeInterval) -> OrderTimeAgo {
        let diff = max(0, now - createdAt)
        let minutes = Int(diff / 60)
        let hours = Int(diff / 3600)
        let days = Int(diff / 86_400)
        if minutes < 1 { return .justNow }
        if hours < 1 { return .minutes(minutes) }
        if days < 1 { return .hours(hours) }
        return .days(days)
    }

    /// Localized text for an ISO-8601 arrival string; falls back to the raw
    /// string when it cannot be parsed.
    static func text(iso: String, now: Date = .now, _ i18n: I18n) -> String {
        guard let date = KitDate.parse(iso) else { return iso }
        switch bucket(createdAt: date.timeIntervalSince1970, now: now.timeIntervalSince1970) {
        case .justNow: return i18n.t("orders.timeJustNow", default: "just now")
        case .minutes(let m): return i18n.t("orders.timeMinutesAgo", ["m": String(m)], default: "\(m)m ago")
        case .hours(let h): return i18n.t("orders.timeHoursAgo", ["h": String(h)], default: "\(h)h ago")
        case .days(let d): return i18n.t("orders.timeDaysAgo", ["d": String(d)], default: "\(d)d ago")
        }
    }
}
