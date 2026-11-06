import Foundation

/// One sale line for the bonus points planner: its price (after discount) and due (after trade-ins).
struct BonusRedeemLine: Equatable {
    let lineId: String
    let price: Decimal
    let due: Decimal
}

/// The result of planning bonus points redemption over cart lines (ADR 0043, ADR 0047).
struct BonusRedeemPlan: Equatable {
    /// The maximum points this cart may spend.
    let max: Decimal
    /// Total points spent: `requested` clamped between 0 and `max`.
    let total: Decimal
    /// lineId -> points to spend on that line.
    let byLine: [String: Decimal]
    /// lineId -> due minus points (what cash/card must cover).
    let payableByLine: [String: Decimal]
}

/// Pure planner for bonus points redemption, ported from `client/src/features/checkout/lib/bonus-redeem.ts`.
/// All math in integer cents to prevent float rounding drift.
enum BonusRedeemPlanner {
    private static func toCents(_ d: Decimal) -> Int {
        var x = d * 100, r = Decimal()
        NSDecimalRound(&r, &x, 0, .plain)
        return (r as NSDecimalNumber).intValue
    }

    private static func fromCents(_ cents: Int) -> Decimal {
        Decimal(cents) / 100
    }

    static func plan(
        lines: [BonusRedeemLine],
        requested: Decimal,
        balance: Decimal,
        maxPercent: Decimal
    ) -> BonusRedeemPlan {
        let requestedCents = max(0, toCents(requested))
        let balanceCents = max(0, toCents(balance))
        let pct = (maxPercent as NSDecimalNumber).doubleValue

        var caps: [Int] = []
        for line in lines {
            let priceCents = max(0, toCents(line.price))
            let dueCents = max(0, toCents(line.due))
            let percentCap = Int(round(Double(priceCents) * pct / 100.0))
            caps.append(min(percentCap, dueCents))
        }

        let capSum = caps.reduce(0, +)
        let maxCents = min(balanceCents, capSum)
        let totalCents = min(requestedCents, maxCents)

        var remaining = totalCents
        var byLine: [String: Decimal] = [:]
        var payableByLine: [String: Decimal] = [:]

        for (i, line) in lines.enumerated() {
            let take = min(remaining, caps[i])
            if take > 0 {
                byLine[line.lineId] = fromCents(take)
            }
            remaining -= take
            let dueCents = max(0, toCents(line.due))
            payableByLine[line.lineId] = fromCents(dueCents - take)
        }

        return BonusRedeemPlan(
            max: fromCents(maxCents),
            total: fromCents(totalCents),
            byLine: byLine,
            payableByLine: payableByLine
        )
    }
}

#if DEBUG
func runBonusRedeemPlannerSelfChecks() {
    // (a) one line, price 100000, due 100000; balance 5000; max 50; requested 5000 → max 5000, total 5000, payable 95000
    let a = BonusRedeemPlanner.plan(
        lines: [BonusRedeemLine(lineId: "1", price: 100000, due: 100000)],
        requested: 5000, balance: 5000, maxPercent: 50
    )
    assert(a.max == 5000, "a.max failed")
    assert(a.total == 5000, "a.total failed")
    assert(a.payableByLine["1"] == 95000, "a.payable failed")

    // (b) one line 100000; balance 200000; max 50; requested 80000 → max 50000, total 50000
    let b = BonusRedeemPlanner.plan(
        lines: [BonusRedeemLine(lineId: "1", price: 100000, due: 100000)],
        requested: 80000, balance: 200000, maxPercent: 50
    )
    assert(b.max == 50000, "b.max failed")
    assert(b.total == 50000, "b.total failed")

    // (c) lines 100000 and 40000; balance 60000; max 50; requested 60000 → 50000 and 10000 by line; payable 50000 and 30000
    let c = BonusRedeemPlanner.plan(
        lines: [
            BonusRedeemLine(lineId: "1", price: 100000, due: 100000),
            BonusRedeemLine(lineId: "2", price: 40000, due: 40000)
        ],
        requested: 60000, balance: 60000, maxPercent: 50
    )
    assert(c.byLine["1"] == 50000, "c.byLine[1] failed")
    assert(c.byLine["2"] == 10000, "c.byLine[2] failed")
    assert(c.payableByLine["1"] == 50000, "c.payableByLine[1] failed")
    assert(c.payableByLine["2"] == 30000, "c.payableByLine[2] failed")

    // (d) price 100000, due 30000; balance 90000; max 50; requested 90000 → max 30000, total 30000, payable 0
    let d = BonusRedeemPlanner.plan(
        lines: [BonusRedeemLine(lineId: "1", price: 100000, due: 30000)],
        requested: 90000, balance: 90000, maxPercent: 50
    )
    assert(d.max == 30000, "d.max failed")
    assert(d.total == 30000, "d.total failed")
    assert(d.payableByLine["1"] == 0, "d.payableByLine[1] failed")

    // (e) balance 0, and then max percent 0 → max 0, total 0, payable equals due
    let e1 = BonusRedeemPlanner.plan(
        lines: [BonusRedeemLine(lineId: "1", price: 100000, due: 100000)],
        requested: 5000, balance: 0, maxPercent: 50
    )
    assert(e1.max == 0 && e1.total == 0 && e1.payableByLine["1"] == 100000, "e1 failed")
    let e2 = BonusRedeemPlanner.plan(
        lines: [BonusRedeemLine(lineId: "1", price: 100000, due: 100000)],
        requested: 5000, balance: 5000, maxPercent: 0
    )
    assert(e2.max == 0 && e2.total == 0 && e2.payableByLine["1"] == 100000, "e2 failed")

    // (f) price 333.33; balance 1000; max 50; requested 1000 → max 166.67
    let f = BonusRedeemPlanner.plan(
        lines: [BonusRedeemLine(lineId: "1", price: Decimal(string: "333.33")!, due: Decimal(string: "333.33")!)],
        requested: 1000, balance: 1000, maxPercent: 50
    )
    assert(f.max == Decimal(string: "166.67")!, "f failed: \(f.max)")

    // (g) requested −5 → total 0
    let g = BonusRedeemPlanner.plan(
        lines: [BonusRedeemLine(lineId: "1", price: 100000, due: 100000)],
        requested: -5, balance: 5000, maxPercent: 50
    )
    assert(g.total == 0, "g failed: \(g.total)")
}
#endif
