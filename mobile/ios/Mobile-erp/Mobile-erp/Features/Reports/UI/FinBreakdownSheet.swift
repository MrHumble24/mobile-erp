import SwiftUI

/// Report drill-down as a Warm Card sheet. Routes a `FinBreakdownRequest` to
/// reports-owned detail: fetched views (NOI rows, returns list, by-model
/// ranking) and zero-fetch fact rows built from an already-loaded row.
struct FinBreakdownSheet: View {
    let request: FinBreakdownRequest
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t(request.titleKey)) { dismiss() }
                content
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Tokens.card)
        .presentationDetents([.medium, .large])
    }

    @ViewBuilder private var content: some View {
        switch request {
        case let .returns(from, to):
            FinReturnsBreakdown(from: from, to: to)
        case let .noi(from, to):
            NoiBreakdownView(from: from, to: to)
        case let .model(from, to, measure):
            ModelBreakdownView(from: from, to: to, measure: measure)
        case let .salesRow(row):
            FinFacts(items: [
                (i18n.t("dashboard.revenue"), reportMoney(row.revenue)),
                (i18n.t("dashboard.cogs"), reportMoney(row.cogs)),
                (i18n.t("dashboard.grossProfit"), reportMoney(row.grossProfit)),
                (i18n.t("dashboard.unitsSold"), "\(row.unitsSold)"),
                (i18n.t("reports.share"), "\(Int((row.share * 100).rounded()))%"),
            ], subject: row.label)
        case let .partner(row):
            FinFacts(items: [
                (i18n.t("reports.outstanding"), reportMoney(row.outstanding)),
                (i18n.t("reports.settled"), reportMoney(row.settledRevenue)),
                (i18n.t("reports.overdueCount"), "\(row.overdueCount)"),
            ], subject: row.shopName)
        case let .inventoryModel(row):
            FinFacts(items: [
                (i18n.t("reports.units"), "\(row.units)"),
                (i18n.t("reports.landedValue"), reportMoney(row.landedValue)),
                (i18n.t("reports.ageBucket"), "\(Int(row.avgDaysInStock.rounded()))\(i18n.t("reports.daysShort"))"),
            ], subject: row.label)
        }
    }
}

/// Keyed fact rows under an optional subject line.
struct FinFacts: View {
    let items: [(String, String)]
    var subject: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.md) {
            if let subject { Text(subject).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text) }
            VStack(spacing: 0) {
                ForEach(Array(items.enumerated()), id: \.offset) { i, item in
                    FactRow(label: item.0, last: i == items.count - 1) { Text(item.1).font(.data(.regular)) }
                }
            }
        }
    }
}

/// Net operating income: revenue − COGS − expenses = NOI, from `/reports/profit`.
private struct NoiBreakdownView: View {
    let from: Date?
    let to: Date?
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var report: ProfitReport?

    var body: some View {
        Group {
            if let report {
                VStack(spacing: 0) {
                    FactRow(label: i18n.t("dashboard.revenue")) { Text(reportMoney(report.revenue)).font(.data(.regular)) }
                    FactRow(label: "− \(i18n.t("dashboard.cogs"))") { Text(reportMoney(report.cogs)).font(.data(.regular)).foregroundStyle(Tokens.danger) }
                    FactRow(label: "− \(i18n.t("dashboard.expenses"))") { Text(reportMoney(report.expenses)).font(.data(.regular)).foregroundStyle(Tokens.danger) }
                    FactRow(label: "= \(i18n.t("dashboard.netOperatingIncome"))", last: true) {
                        Text(reportMoney(report.netOperatingIncome)).font(.mono(17, weight: .semibold))
                            .foregroundStyle(moneyTint(.profit, report.netOperatingIncome))
                    }
                }
            } else {
                LoadingView().frame(height: 120)
            }
        }
        .task { report = try? await ReportsRepository(api: container.api).profit(from: from, to: to) }
    }
}

/// By-model ranking for gross profit or units.
private struct ModelBreakdownView: View {
    let from: Date?
    let to: Date?
    let measure: FinModelMeasure
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var rows: [FinBreakdownRow]?

    private func value(_ r: FinBreakdownRow) -> Double { measure == .units ? Double(r.unitsSold) : r.grossProfit }

    var body: some View {
        Group {
            if let rows {
                if rows.isEmpty {
                    Text(i18n.t("reports.empty")).font(.ui(.body)).foregroundStyle(Tokens.muted)
                } else {
                    // Gross profit can be negative: rank and share on magnitude, show the signed value.
                    let total = max(1, rows.reduce(0.0) { $0 + abs(value($1)) })
                    FinBreakdownRows(rows: rows.sorted { abs(value($0)) > abs(value($1)) }.map {
                        FinShareRow(key: $0.key, label: $0.label,
                                    value: measure == .units ? "\($0.unitsSold)" : reportMoney($0.grossProfit),
                                    share: abs(value($0)) / total, negative: value($0) < 0)
                    })
                }
            } else {
                LoadingView().frame(height: 120)
            }
        }
        .task { rows = (try? await ReportsRepository(api: container.api).profitBreakdown(groupBy: "model", from: from, to: to)) ?? [] }
    }
}
