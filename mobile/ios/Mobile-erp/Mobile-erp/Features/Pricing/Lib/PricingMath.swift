import Foundation

/// How a discount is expressed on a line or the whole sale (ADR 0034).
enum PosDiscountMode: String, Equatable { case none, percent, amount }

/// The money rules of a priced checkout, as pure functions mirroring the
/// server's `checkout-pricing.ts` (ADR 0034), so the till stops the seller
/// before the API does and the `salePrice` it sends matches the server exactly.
/// All amounts are `Decimal`; rounding is half-up to 2 dp, as Prisma rounds.
enum PricingMath {
    /// Half-up to 2 dp (money is positive, so NSDecimal `.plain` == ROUND_HALF_UP).
    static func round2(_ d: Decimal) -> Decimal {
        var input = d, result = Decimal()
        NSDecimalRound(&result, &input, 2, .plain)
        return result
    }

    /// The rounded discount amount for a line (0 when none / non-positive).
    static func discountAmount(mode: PosDiscountMode, value: Decimal, list: Decimal) -> Decimal {
        guard value > 0, list > 0 else { return 0 }
        switch mode {
        case .none: return 0
        case .percent: return round2(list * value / 100)
        case .amount: return round2(value)
        }
    }

    /// The final (payable) price of a line: list − discount, never below zero.
    static func finalPrice(list: Decimal, mode: PosDiscountMode, value: Decimal) -> Decimal {
        let final = list - discountAmount(mode: mode, value: value, list: list)
        return final < 0 ? 0 : final
    }

    /// The cashier's effective ceiling: the larger of the shop max and the
    /// customer's standing discount, both as a percent (ADR 0034).
    static func cap(cashierMax: Decimal, standing: Decimal) -> Decimal { max(cashierMax, standing) }

    /// The `pricing.error…` key for a disallowed discount, or nil when it is
    /// fine — mirrors the server so the seller is stopped first.
    static func validate(mode: PosDiscountMode, value: Decimal, list: Decimal,
                         cap: Decimal, unlimited: Bool) -> String? {
        guard mode != .none, value > 0 else { return nil }
        let amount = discountAmount(mode: mode, value: value, list: list)
        if amount > list { return "pricing.errorDiscountAboveList" }
        if unlimited { return nil }
        let percent = mode == .percent ? value : (list > 0 ? amount / list * 100 : 0)
        if percent - cap > tolerance { return "pricing.errorDiscountTooHigh" }
        return nil
    }

    /// Spread a whole-sale discount over the lines in proportion to their list
    /// prices, as per-line AMOUNT discounts that sum **exactly** to the cart
    /// discount. Works in integer tiyin with largest-remainder so no money is
    /// lost or invented. A line with no list price gets nothing. The caller has
    /// already checked the cart discount does not exceed the sum of list prices.
    static func spread(cartDiscount: Decimal, lineLists: [Decimal]) -> [Decimal] {
        let n = lineLists.count
        guard n > 0 else { return [] }
        let disc = cents(cartDiscount)
        let weights = lineLists.map { cents($0) }
        let sumW = weights.reduce(0, +)
        guard disc > 0, sumW > 0 else { return Array(repeating: 0, count: n) }

        var base = [Int](repeating: 0, count: n)
        var order = [(idx: Int, remainder: Int)]()
        var assigned = 0
        for i in 0..<n {
            let numer = disc * weights[i]
            base[i] = numer / sumW
            order.append((i, numer % sumW))
            assigned += base[i]
        }
        // base underestimates each share by < 1 tiyin, so leftover < n; hand one
        // extra tiyin each to the largest remainders (ties → larger line, then idx).
        let leftover = disc - assigned
        order.sort { a, b in
            if a.remainder != b.remainder { return a.remainder > b.remainder }
            if weights[a.idx] != weights[b.idx] { return weights[a.idx] > weights[b.idx] }
            return a.idx < b.idx
        }
        for k in 0..<max(0, leftover) where k < order.count { base[order[k].idx] += 1 }
        return base.map { Decimal($0) / 100 }
    }

    // MARK: - internals

    private static let tolerance = Decimal(string: "0.0001")!

    /// Round to whole tiyin (×100) as an Int.
    private static func cents(_ d: Decimal) -> Int {
        var scaled = round2(d) * 100, whole = Decimal()
        NSDecimalRound(&whole, &scaled, 0, .plain)
        return NSDecimalNumber(decimal: whole).intValue
    }
}

#if DEBUG
/// Self-check (ADR 0034): a line's price per level, percent + amount discounts,
/// the cashier limit and the standing discount raising it, spreading a cart
/// discount over three awkward prices so the parts add up exactly, and the
/// amount to pay that feeds the split.
enum PricingSelfCheck {
    static let ran: Void = {
        let prices = PriceLevelPrices(["RETAIL": "1200.00", "WHOLESALE": "1100.00", "PARTNER": "1000.00"])
        assert(prices.decimal(PriceLevels.retail) == Decimal(string: "1200.00"))
        assert(prices.decimal(PriceLevels.wholesale) == Decimal(string: "1100.00"))
        assert(prices.decimal(PriceLevels.partner) == Decimal(string: "1000.00"))
        assert(prices.decimal("GOLD") == nil)

        // Percent discount: 10% of 1200 = 120 → final 1080.
        let list = Decimal(1200)
        assert(PricingMath.discountAmount(mode: .percent, value: 10, list: list) == 120)
        assert(PricingMath.finalPrice(list: list, mode: .percent, value: 10) == 1080)
        // Amount discount: 150 off → final 1050.
        assert(PricingMath.discountAmount(mode: .amount, value: 150, list: list) == 150)
        assert(PricingMath.finalPrice(list: list, mode: .amount, value: 150) == 1050)
        // Half-up rounding: 3.33% of 100 = 3.33.
        assert(PricingMath.discountAmount(mode: .percent, value: Decimal(string: "3.335")!, list: 100)
               == Decimal(string: "3.34")!)

        // Cashier ceiling 5%: 6% refused, 5% allowed.
        let cap5 = PricingMath.cap(cashierMax: 5, standing: 0)
        assert(cap5 == 5)
        assert(PricingMath.validate(mode: .percent, value: 6, list: list, cap: cap5, unlimited: false)
               == "pricing.errorDiscountTooHigh")
        assert(PricingMath.validate(mode: .percent, value: 5, list: list, cap: cap5, unlimited: false) == nil)
        // The customer's 8% standing discount raises the ceiling so 8% is allowed.
        let capStanding = PricingMath.cap(cashierMax: 5, standing: 8)
        assert(capStanding == 8)
        assert(PricingMath.validate(mode: .percent, value: 8, list: list, cap: capStanding, unlimited: false) == nil)
        assert(PricingMath.validate(mode: .percent, value: 9, list: list, cap: capStanding, unlimited: false)
               == "pricing.errorDiscountTooHigh")
        // Over the list price is always refused.
        assert(PricingMath.validate(mode: .amount, value: 1300, list: list, cap: capStanding, unlimited: false)
               == "pricing.errorDiscountAboveList")
        // The unlimited permission bypasses the ceiling (but not above-list).
        assert(PricingMath.validate(mode: .percent, value: 90, list: list, cap: cap5, unlimited: true) == nil)

        // Spread 100 over three awkward prices: 333.33 / 333.33 / 333.34.
        let lists = [Decimal(string: "333.33")!, Decimal(string: "333.33")!, Decimal(string: "333.34")!]
        let parts = PricingMath.spread(cartDiscount: 100, lineLists: lists)
        assert(parts.reduce(Decimal.zero, +) == 100, "line discounts must sum to the cart discount")
        // Each part is close to its proportional share (≈ 33.33).
        assert(parts.allSatisfy { abs($0 - Decimal(string: "33.333")!) < 1 })

        // A second awkward spread: 10 over 7 / 11 / 13 sums exactly to 10.
        let parts2 = PricingMath.spread(cartDiscount: 10,
                                        lineLists: [Decimal(7), Decimal(11), Decimal(13)])
        assert(parts2.reduce(Decimal.zero, +) == 10)

        // The amount to pay feeds the split: three finals must sum to the payable.
        let finals = zip(lists, parts).map { $0 - $1 }
        let payable = finals.reduce(Decimal.zero, +)
        assert(payable == lists.reduce(Decimal.zero, +) - 100)
    }()
}
#endif
