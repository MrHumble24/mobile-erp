import Foundation

/// Pure payment-plan arithmetic for customer credit — no interest, no fee, only
/// splitting a principal into parts (ADR 0035). Mirrors the web `credit-plan.ts`
/// so the till blocks before the server does. Money is handled in integer tiyin
/// (×100, half-up) so nothing drifts, and dates live at 00:00 UTC like the
/// server's DATE instalments.
enum CreditPlan {
    /// How the following parts fall after the first due date.
    enum Frequency: String, CaseIterable { case month, week }

    // MARK: - Money (integer tiyin)

    /// A money Decimal → whole tiyin (×100, half-up).
    static func cents(_ value: Decimal) -> Int {
        var scaled = value * 100, whole = Decimal()
        NSDecimalRound(&whole, &scaled, 0, .plain)
        return NSDecimalNumber(decimal: whole).intValue
    }

    /// Parse a money string → whole tiyin (0 when blank).
    static func cents(_ value: String) -> Int {
        cents(Decimal(string: value.trimmingCharacters(in: .whitespaces)) ?? .zero)
    }

    /// Whole tiyin → a money Decimal.
    static func money(_ cents: Int) -> Decimal { Decimal(cents) / 100 }

    /// Whole tiyin → a canonical 2-dp money string.
    static func moneyString(_ cents: Int) -> String {
        NSDecimalNumber(decimal: money(cents)).stringValue
    }

    /// Split `total` tiyin into `parts` positive amounts, as even as possible, the
    /// rounding remainder on the LAST part. `parts < 1` or a negative total → empty.
    static func evenSplit(_ total: Int, parts: Int) -> [Int] {
        guard parts >= 1, total >= 0 else { return [] }
        let base = total / parts
        var result = Array(repeating: base, count: parts)
        result[parts - 1] = total - base * (parts - 1)
        return result
    }

    // MARK: - Dates (00:00 UTC)

    private static var utc: Calendar {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(identifier: "UTC")!
        return c
    }

    static func startOfUtcDay(_ d: Date) -> Date { utc.startOfDay(for: d) }

    static func addMonths(_ d: Date, _ n: Int) -> Date {
        utc.date(byAdding: .month, value: n, to: startOfUtcDay(d)) ?? d
    }

    static func addWeeks(_ d: Date, _ n: Int) -> Date {
        utc.date(byAdding: .day, value: n * 7, to: startOfUtcDay(d)) ?? d
    }

    /// A Date → `YYYY-MM-DD` in UTC — the shape the API takes.
    static func dateInput(_ d: Date) -> String {
        let f = DateFormatter()
        f.calendar = utc
        f.timeZone = utc.timeZone
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: d)
    }

    // MARK: - Plan

    /// An even plan: `amountCents` across `parts`, the first due on `firstDue`,
    /// each later part one month/week on. The remainder rides the last part.
    static func buildEvenPlan(amountCents: Int, parts: Int, firstDue: Date,
                              every: Frequency) -> [(due: Date, amount: Int)] {
        evenSplit(amountCents, parts: parts).enumerated().map { i, c in
            (every == .month ? addMonths(firstDue, i) : addWeeks(firstDue, i), c)
        }
    }

    /// What is still unplanned, in tiyin: cart total − down payment − Σ parts.
    /// Zero means the plan balances; the till blocks checkout until it is zero.
    static func planRemaining(cartTotal: Decimal, downPayment: Decimal,
                              instalments: [String]) -> Int {
        cents(cartTotal) - cents(downPayment) - instalments.reduce(0) { $0 + cents($1) }
    }

    /// True when selling this credit pushes the customer's owed principal past
    /// their effective limit. `newUnpaid` = cart total − down payment. A nil limit
    /// is no cap — there is never any interest.
    static func wouldExceedLimit(currentOutstanding: Decimal, newUnpaid: Decimal,
                                 limit: Decimal?) -> Bool {
        guard let limit else { return false }
        return cents(currentOutstanding) + cents(newUnpaid) > cents(limit)
    }

    /// True when a due date is before today, in UTC days.
    static func isPastDue(_ due: Date, now: Date = Date()) -> Bool {
        startOfUtcDay(due) < startOfUtcDay(now)
    }
}

#if DEBUG
/// Self-check (ADR 0035): an even split of an awkward amount sums exactly, the
/// remainder rides the last part, "left to plan" reaches zero, and the limit
/// guard. Pure maths only — no interest or fee anywhere.
enum CreditPlanSelfCheck {
    static let ran: Void = {
        // 100.00 over 3 parts → 33.33 / 33.33 / 33.34, summing to 100.00.
        let three = CreditPlan.evenSplit(10_000, parts: 3)
        assert(three == [3_333, 3_333, 3_334])
        assert(three.reduce(0, +) == 10_000)

        // An awkward total: 10.00 over 7 → the remainder lands on the last part.
        let seven = CreditPlan.evenSplit(1_000, parts: 7)
        assert(seven.reduce(0, +) == 1_000)
        assert(seven.dropLast().allSatisfy { $0 == seven[0] })

        // Left to plan: 500 total, 100 down, two 200 parts → 0.
        let rem = CreditPlan.planRemaining(
            cartTotal: 500, downPayment: 100,
            instalments: ["200", "200"])
        assert(rem == 0)
        // A short plan leaves a positive remainder (checkout blocked).
        assert(CreditPlan.planRemaining(cartTotal: 500, downPayment: 100,
                                        instalments: ["200"]) == 20_000)

        // Limit: 800 owed + 300 new over a 1000 cap is over; a nil cap never is.
        assert(CreditPlan.wouldExceedLimit(currentOutstanding: 800, newUnpaid: 300, limit: 1_000))
        assert(!CreditPlan.wouldExceedLimit(currentOutstanding: 800, newUnpaid: 100, limit: 1_000))
        assert(!CreditPlan.wouldExceedLimit(currentOutstanding: 8_000, newUnpaid: 9_000, limit: nil))

        // An even monthly plan keeps the down payment out of the parts.
        let plan = CreditPlan.buildEvenPlan(amountCents: 20_000, parts: 2,
                                            firstDue: Date(), every: .month)
        assert(plan.count == 2)
        assert(plan.reduce(0) { $0 + $1.amount } == 20_000)
    }()
}
#endif
