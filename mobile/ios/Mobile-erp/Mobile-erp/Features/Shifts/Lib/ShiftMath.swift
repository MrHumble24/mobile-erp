import Foundation

/// Pure shift arithmetic (ADR 0036). The only derived figure the client computes
/// is the closing difference the cashier previews before confirming — counted −
/// expected — in tiyin so it never drifts, mirroring the server's close maths.
/// Everything else (expected cash, per-account/type groups) comes from the server.
enum ShiftMath {
    /// A money Decimal → whole tiyin (×100, half-up).
    static func cents(_ value: Decimal) -> Int {
        var scaled = value * 100, whole = Decimal()
        NSDecimalRound(&whole, &scaled, 0, .plain)
        return NSDecimalNumber(decimal: whole).intValue
    }

    static func cents(_ value: String) -> Int {
        cents(Decimal(string: value.trimmingCharacters(in: .whitespaces)) ?? .zero)
    }

    /// counted − expected, as an exact Decimal.
    static func difference(counted: Decimal, expected: Decimal) -> Decimal {
        Decimal(cents(counted) - cents(expected)) / 100
    }

    static func difference(counted: String, expected: String) -> Decimal {
        Decimal(cents(counted) - cents(expected)) / 100
    }

    /// Short classification of a difference for colour + wording.
    enum Kind { case none, short, over }

    static func kind(_ difference: Decimal) -> Kind {
        let c = cents(difference)
        if c == 0 { return .none }
        return c < 0 ? .short : .over
    }
}

#if DEBUG
/// Self-check (ADR 0036): the closing difference is exact for an awkward count,
/// and the short / over classification.
enum ShiftMathSelfCheck {
    static let ran: Void = {
        // expected 11,500,000, counted 11,480,000 → −20,000 (short).
        let d = ShiftMath.difference(counted: "11480000", expected: "11500000")
        assert(d == Decimal(string: "-20000")!)
        assert(ShiftMath.kind(d) == .short)
        // counted more than expected → over.
        let over = ShiftMath.difference(counted: "100.25", expected: "100.00")
        assert(over == Decimal(string: "0.25")!)
        assert(ShiftMath.kind(over) == .over)
        // exact → none.
        assert(ShiftMath.kind(ShiftMath.difference(counted: "50", expected: "50")) == .none)
    }()
}
#endif
