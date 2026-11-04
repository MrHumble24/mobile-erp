import SwiftUI

/// The one rule for tinting a financial figure, by what it means and its sign.
/// Profit (net or gross) is green when ≥ 0 and red when negative; revenue is
/// neutral `text`; expenses are always red. Used by every money tile (dashboard
/// and reports) so a loss never reads green.
enum MoneyMetric { case profit, revenue, expense }

func moneyTint(_ metric: MoneyMetric, _ value: Double?) -> Color {
    switch metric {
    case .revenue: return Tokens.text
    case .expense: return Tokens.danger
    case .profit: return (value ?? 0) < 0 ? Tokens.danger : Tokens.success
    }
}
