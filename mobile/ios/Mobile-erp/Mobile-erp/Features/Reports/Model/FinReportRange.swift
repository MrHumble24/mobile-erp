import Foundation

/// Shared date-range filter for the report tabs, mirroring the web
/// `shared/lib/date-range.ts` presets and `use-report-range` bucket rule.
enum FinRangePreset: String, CaseIterable, Identifiable {
    case today, sevenDay, thirtyDay, month, lastMonth, custom
    var id: String { rawValue }

    /// Web i18n key under `reports.preset_*`.
    var labelKey: String {
        switch self {
        case .today: "reports.preset_today"
        case .sevenDay: "reports.preset_7d"
        case .thirtyDay: "reports.preset_30d"
        case .month: "reports.preset_month"
        case .lastMonth: "reports.preset_lastMonth"
        case .custom: "reports.preset_custom"
        }
    }
}

/// Preset + custom bounds; `dates` resolves the active inclusive [from, to].
struct FinReportRange {
    var preset: FinRangePreset = .thirtyDay
    var customFrom: Date?
    var customTo: Date?

    var dates: (from: Date?, to: Date?) {
        let cal = Calendar.current
        let now = Date()
        let startOfMonth = cal.date(from: cal.dateComponents([.year, .month], from: now))
        switch preset {
        case .today:
            return (cal.startOfDay(for: now), now)
        case .sevenDay:
            return (cal.date(byAdding: .day, value: -6, to: cal.startOfDay(for: now)), now)
        case .thirtyDay:
            return (cal.date(byAdding: .day, value: -29, to: cal.startOfDay(for: now)), now)
        case .month:
            return (startOfMonth, now)
        case .lastMonth:
            guard let startThis = startOfMonth,
                  let start = cal.date(byAdding: .month, value: -1, to: startThis),
                  let end = cal.date(byAdding: .day, value: -1, to: startThis)
            else { return (nil, now) }
            return (start, end)
        case .custom:
            return (customFrom, customTo)
        }
    }

    /// One-line label for the period bar: the preset name, or the custom bounds.
    func label(_ i18n: I18n) -> String {
        if preset == .custom, let from = customFrom, let to = customTo {
            return "\(KitDate.day(ISO8601DateFormatter().string(from: from))) – \(KitDate.day(ISO8601DateFormatter().string(from: to)))"
        }
        return i18n.t(preset.labelKey)
    }

    /// Trend bucket from the span (≤31d → day, ≤180d → week, else month).
    var bucket: String {
        let (from, to) = dates
        guard let from, let to else { return "day" }
        let days = to.timeIntervalSince(from) / 86_400 + 1
        if days <= 31 { return "day" }
        if days <= 180 { return "week" }
        return "month"
    }
}
