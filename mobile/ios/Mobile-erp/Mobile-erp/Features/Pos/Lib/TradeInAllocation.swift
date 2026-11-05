import Foundation

/// A phone taken in part payment at the till (ADR 0039). Client-only cart state;
/// becomes a `SaleTradeInPost` on the one sale line it is allocated to.
struct PosTradeIn: Identifiable, Equatable {
    let id: String
    let modelId: String
    let modelLabel: String
    let imei: String?
    let imei2: String?
    let serialNumber: String?
    let specs: [String: String]
    let value: Decimal

    var code: String { UnitCode.display(imei: imei, serialNumber: serialNumber) }
}

/// One trade-in on a `POST /sales` body (ADR 0039). Swift omits nil optionals,
/// so absent codes / empty specs never reach the server's `forbidNonWhitelisted`.
nonisolated struct SaleTradeInPost: Encodable, Equatable {
    let modelId: String
    let imei: String?
    let imei2: String?
    let serialNumber: String?
    let specs: [String: String]?
    let value: Double
}

/// Plans the cart's trade-ins over its lines (ADR 0039), ported from the web
/// `allocate-trade-ins.ts` + `trade-in-plan.ts`. The till posts one sale per
/// line, and a trade-in belongs to ONE line and may not exceed that line's
/// price, so each trade-in is placed — largest first — on the line with the
/// largest remaining price. Pure; tiyin-exact via integer cents.
enum TradeInAllocation {
    struct Line: Equatable { let id: String; let price: Decimal }
    struct Item: Equatable { let id: String; let value: Decimal }

    struct Plan: Equatable {
        /// False when a trade-in fits no single line — checkout must refuse.
        let ok: Bool
        let tradeInTotal: Decimal
        /// Cart total − trade-ins: what the customer still tenders.
        let amountToPay: Decimal
        /// Per line id, its price minus the trade-ins placed on it.
        let payableByLine: [String: Decimal]
        /// Per line id, the trade-in item ids placed on it.
        let itemsByLine: [String: [String]]
        /// The trade-in no single line could carry; set only when `ok` is false.
        let unplaceableId: String?
    }

    private static func cents(_ d: Decimal) -> Int {
        var x = d * 100, r = Decimal()
        NSDecimalRound(&r, &x, 0, .plain)
        return (r as NSDecimalNumber).intValue
    }
    private static func money(_ cents: Int) -> Decimal { Decimal(cents) / 100 }

    static func plan(lines: [Line], items: [Item]) -> Plan {
        let dueTotal = lines.reduce(Decimal.zero) { $0 + $1.price }
        let total = items.reduce(Decimal.zero) { $0 + $1.value }
        let base = Dictionary(uniqueKeysWithValues: lines.map { ($0.id, $0.price) })
        let empty = Dictionary(uniqueKeysWithValues: lines.map { ($0.id, [String]()) })

        if items.isEmpty {
            return Plan(ok: true, tradeInTotal: 0, amountToPay: dueTotal,
                        payableByLine: base, itemsByLine: empty, unplaceableId: nil)
        }

        var remaining = Dictionary(uniqueKeysWithValues: lines.map { ($0.id, cents($0.price)) })
        var valueCents: [String: Int] = [:]
        var itemsByLine = empty

        // Largest trade-in first, so a big trade-in claims a big line before small ones.
        for item in items.sorted(by: { $0.value > $1.value }) {
            let c = cents(item.value)
            var bestLine: String?
            var bestRemaining = -1
            for line in lines {   // deterministic order (web iterates insertion order)
                let rem = remaining[line.id] ?? 0
                if rem >= c && rem > bestRemaining { bestLine = line.id; bestRemaining = rem }
            }
            guard let best = bestLine else {
                return Plan(ok: false, tradeInTotal: total, amountToPay: dueTotal - total,
                            payableByLine: base, itemsByLine: empty, unplaceableId: item.id)
            }
            remaining[best] = bestRemaining - c
            valueCents[best, default: 0] += c
            itemsByLine[best]?.append(item.id)
        }

        var payableByLine: [String: Decimal] = [:]
        for line in lines { payableByLine[line.id] = line.price - money(valueCents[line.id] ?? 0) }
        return Plan(ok: true, tradeInTotal: total, amountToPay: dueTotal - total,
                    payableByLine: payableByLine, itemsByLine: itemsByLine, unplaceableId: nil)
    }
}

#if DEBUG
/// Self-check: the allocation and the amount-to-pay match the web spec cases.
enum TradeInAllocationSelfCheck {
    static let ran: Void = {
        // A trade-in placed on the only line it fits; amount to pay nets it off.
        let p1 = TradeInAllocation.plan(
            lines: [.init(id: "a", price: 6_500_000)],
            items: [.init(id: "t", value: 1_000_000)])
        assert(p1.ok)
        assert(p1.amountToPay == 5_500_000)
        assert(p1.payableByLine["a"] == 5_500_000)
        assert(p1.itemsByLine["a"] == ["t"])

        // Largest-first: the big trade-in claims the big line.
        let p2 = TradeInAllocation.plan(
            lines: [.init(id: "a", price: 300), .init(id: "b", price: 1000)],
            items: [.init(id: "x", value: 800), .init(id: "y", value: 250)])
        assert(p2.ok)
        assert(p2.itemsByLine["b"] == ["x"])
        assert(p2.itemsByLine["a"] == ["y"])
        assert(p2.amountToPay == 250)   // 1300 − 1050

        // A trade-in worth more than any single line → refused.
        let p3 = TradeInAllocation.plan(
            lines: [.init(id: "a", price: 300), .init(id: "b", price: 400)],
            items: [.init(id: "big", value: 500)])
        assert(!p3.ok)
        assert(p3.unplaceableId == "big")

        // No trade-ins → the cart is unchanged.
        let p0 = TradeInAllocation.plan(lines: [.init(id: "a", price: 100)], items: [])
        assert(p0.ok && p0.amountToPay == 100 && p0.tradeInTotal == 0)
    }()
}
#endif
