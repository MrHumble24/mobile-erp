import Foundation

/// Pure stock arithmetic for the adjust sheet (ADR 0030). The count correction
/// writes `counted − current`; the sheet shows this difference before saving.
enum StockMath {
    static func countDifference(counted: Int, current: Int) -> Int { counted - current }
}

#if DEBUG
/// Self-check for the count-correction difference. Runs once on first Stock view.
enum StockSelfCheck {
    static let ran: Void = {
        assert(StockMath.countDifference(counted: 12, current: 5) == 7)   // short on shelf → +7
        assert(StockMath.countDifference(counted: 3, current: 10) == -7)  // overstated → −7
        assert(StockMath.countDifference(counted: 5, current: 5) == 0)    // no change → 0
    }()
}
#endif
