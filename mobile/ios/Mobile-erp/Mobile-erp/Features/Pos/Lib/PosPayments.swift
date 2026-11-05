import Foundation

/// One tender line sent with a sale (`POST /sales` and the offline outbox).
/// Amount is a positive `Decimal` so it encodes as an exact JSON number (never a
/// Double); accounts must be distinct and sum to the sale price. Omit the whole
/// array for a plain CASH sale.
nonisolated struct SalePaymentPost: Encodable, Equatable {
    let accountCode: String
    let amount: Decimal
}

/// Split a cart-level payment breakdown across the per-line sale prices so each
/// line's payments sum to its own price while the per-account totals still match
/// the breakdown. One `POST /sales` goes out per line, so the cart's single
/// Cash/Card/Split choice is allocated here. The breakdown amounts must sum to
/// the sum of the line prices (the checkout bar enforces this for a split).
///
/// An empty breakdown yields an empty array per line → the caller omits
/// `payments`, which the server reads as one CASH payment of the price.
func allocateSalePayments(
    breakdown: [(code: String, amount: Decimal)],
    linePrices: [Decimal]
) -> [[SalePaymentPost]] {
    var queue = breakdown.filter { $0.amount > 0 }
    var head = 0
    var left = queue.first?.amount ?? .zero
    var result: [[SalePaymentPost]] = []

    for price in linePrices {
        var need = price
        var line: [SalePaymentPost] = []
        while need > 0, head < queue.count {
            let take = min(need, left)
            if take > 0 {
                line.append(SalePaymentPost(accountCode: queue[head].code, amount: take))
            }
            need -= take
            left -= take
            if left <= 0 {
                head += 1
                left = head < queue.count ? queue[head].amount : .zero
            }
        }
        result.append(line)
    }
    return result
}

#if DEBUG
/// Self-check: allocation covers each line and preserves the per-account totals.
enum PosPaymentsSelfCheck {
    static let ran: Void = {
        // Card over two lines → each line one CARD payment of its own price.
        let card = allocateSalePayments(
            breakdown: [("CARD", 300)], linePrices: [100, 200])
        assert(card[0] == [SalePaymentPost(accountCode: "CARD", amount: 100)])
        assert(card[1] == [SalePaymentPost(accountCode: "CARD", amount: 200)])

        // Split across a single line → both tenders on that line.
        let split = allocateSalePayments(
            breakdown: [("CASH", 60), ("CARD", 40)], linePrices: [100])
        assert(split[0] == [SalePaymentPost(accountCode: "CASH", amount: 60),
                            SalePaymentPost(accountCode: "CARD", amount: 40)])

        // Split spanning a line boundary: 150 cash + 50 card over 100 + 100.
        let span = allocateSalePayments(
            breakdown: [("CASH", 150), ("CARD", 50)], linePrices: [100, 100])
        assert(span[0] == [SalePaymentPost(accountCode: "CASH", amount: 100)])
        assert(span[1] == [SalePaymentPost(accountCode: "CASH", amount: 50),
                           SalePaymentPost(accountCode: "CARD", amount: 50)])

        // Multi-phone straddle (the cross-platform case): prices 500 + 700,
        // cash 800, card 400 → phone 1 all cash, phone 2 straddles.
        let straddle = allocateSalePayments(
            breakdown: [("CASH", 800), ("CARD", 400)], linePrices: [500, 700])
        assert(straddle[0] == [SalePaymentPost(accountCode: "CASH", amount: 500)])
        assert(straddle[1] == [SalePaymentPost(accountCode: "CASH", amount: 300),
                               SalePaymentPost(accountCode: "CARD", amount: 400)])
        // Each phone's payments sum to its own price.
        assert(straddle[1].reduce(Decimal.zero) { $0 + $1.amount } == 700)

        // Empty breakdown → omit payments on every line.
        let cash = allocateSalePayments(breakdown: [], linePrices: [100, 50])
        assert(cash == [[], []])
    }()
}
#endif
