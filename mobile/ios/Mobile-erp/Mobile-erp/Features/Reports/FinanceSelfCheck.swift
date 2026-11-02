#if DEBUG
import Foundation

/// Assert-based self-check for this slice's non-trivial pure logic: the
/// tolerant report decoding (missing/redacted cost fields default to 0, nested
/// `byChannel` is flattened, null cost stays nil). Runs once, lazily, the first
/// time a report screen appears (`_ = FinanceSelfCheck.run`). The lazy stand-in
/// for a test target — no new targets, DEBUG only.
enum FinanceSelfCheck {
    static let run: Void = {
        // Profit with cost/channel present.
        let full = #"{"revenue":1000,"cogs":600,"unitsSold":3,"grossProfit":400,"expenses":50,"netOperatingIncome":350,"byChannel":{"retail":700,"b2b":300},"returnsRefunded":0}"#
        let p = try! JSONDecoder().decode(ProfitReport.self, from: Data(full.utf8))
        assert(p.revenue == 1000 && p.retail == 700 && p.b2b == 300 && p.unitsSold == 3)

        // Redacted: cost + channel absent → defaults, no decode failure.
        let redacted = #"{"revenue":1000,"grossProfit":400,"expenses":50,"netOperatingIncome":350,"returnsRefunded":0}"#
        let r = try! JSONDecoder().decode(ProfitReport.self, from: Data(redacted.utf8))
        assert(r.cogs == 0 && r.retail == 0 && r.unitsSold == 0)

        // Pricing: null cost stays nil (→ "—" in UI).
        let row = #"{"modelId":"m1","storage":"128GB","avgAcquisitionCost":null,"avgSellingPrice":500,"unitsInStock":2,"unitsSold":1}"#
        let mp = try! JSONDecoder().decode(ModelPricingRow.self, from: Data(row.utf8))
        assert(mp.avgAcquisitionCost == nil && mp.avgSellingPrice == 500)
    }()
}
#endif
