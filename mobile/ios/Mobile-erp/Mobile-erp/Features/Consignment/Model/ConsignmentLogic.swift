import Foundation

/// Pure helpers shared by the consignment screens: period-filter bounds (the
/// mobile port of the web `shared/lib/date-range`) and days-overdue. No I/O, no
/// state — covered by `consignmentSelfCheck()` in DEBUG.
enum ConsignmentLogic {
    private static let dayFmt: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(identifier: "UTC")
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    /// yyyy-MM-dd bounds for a preset; `custom` passes `from`/`to` through and
    /// `all` yields empty bounds (no date filter).
    static func bounds(_ preset: RangePreset, from: String = "", to: String = "",
                       now: Date = Date()) -> (from: String, to: String) {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "UTC")!
        let today = cal.startOfDay(for: now)
        func s(_ d: Date) -> String { dayFmt.string(from: d) }

        switch preset {
        case .all: return ("", "")
        case .custom: return (from, to)
        case .today: return (s(today), s(today))
        case .d7: return (s(cal.date(byAdding: .day, value: -6, to: today)!), s(today))
        case .d30: return (s(cal.date(byAdding: .day, value: -29, to: today)!), s(today))
        case .month:
            let start = cal.date(from: cal.dateComponents([.year, .month], from: today))!
            return (s(start), s(today))
        case .lastMonth:
            let firstThis = cal.date(from: cal.dateComponents([.year, .month], from: today))!
            let start = cal.date(byAdding: .month, value: -1, to: firstThis)!
            let end = cal.date(byAdding: .day, value: -1, to: firstThis)!
            return (s(start), s(end))
        }
    }

    /// Whole days an OUT consignment is past due; 0 for resolved or not-yet-due.
    static func daysOverdue(dueDate: String, statusCode: String, now: Date = Date()) -> Int {
        guard statusCode == "OUT", let due = parseDate(dueDate) else { return 0 }
        let diff = now.timeIntervalSince(due)
        return diff > 0 ? Int(diff / 86_400) : 0
    }

    /// Parse a server ISO-8601 datetime (with or without fractional seconds).
    static func parseDate(_ s: String) -> Date? {
        let withFrac = ISO8601DateFormatter()
        withFrac.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = withFrac.date(from: s) { return d }
        return ISO8601DateFormatter().date(from: s) ?? dayFmt.date(from: s)
    }
}

#if DEBUG
/// Runs once from the consignments screen in DEBUG (the slice's self-check,
/// since the foundation's launch check lives in core we may not touch).
func consignmentSelfCheck() {
    let jan1 = "2026-01-01T00:00:00.000Z"
    let now = ConsignmentLogic.parseDate("2026-01-11T00:00:00.000Z")!
    assert(ConsignmentLogic.daysOverdue(dueDate: jan1, statusCode: "OUT", now: now) == 10)
    assert(ConsignmentLogic.daysOverdue(dueDate: jan1, statusCode: "SETTLED", now: now) == 0)
    assert(ConsignmentLogic.daysOverdue(dueDate: "2026-02-01T00:00:00.000Z",
                                        statusCode: "OUT", now: now) == 0)

    let ref = ConsignmentLogic.parseDate("2026-03-15T12:00:00.000Z")!
    assert(ConsignmentLogic.bounds(.today, now: ref) == ("2026-03-15", "2026-03-15"))
    assert(ConsignmentLogic.bounds(.d7, now: ref) == ("2026-03-09", "2026-03-15"))
    assert(ConsignmentLogic.bounds(.month, now: ref) == ("2026-03-01", "2026-03-15"))
    assert(ConsignmentLogic.bounds(.lastMonth, now: ref) == ("2026-02-01", "2026-02-28"))
    assert(ConsignmentLogic.bounds(.all) == ("", ""))
}
#endif
