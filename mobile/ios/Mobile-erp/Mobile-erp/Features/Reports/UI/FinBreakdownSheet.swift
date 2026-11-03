import SwiftUI

/// Report drill-down sheet. Routes a `FinBreakdownRequest` to reports-owned
/// detail: fetched views (NOI waterfall, returns list, by-model table) and
/// zero-fetch detail cards built from an already-loaded row.
struct FinBreakdownSheet: View {
    let request: FinBreakdownRequest
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            container
                .navigationTitle(i18n.t(request.titleKey))
                .navigationBarTitleDisplayMode(.inline)
                .background(Tokens.bg)
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button(i18n.t("common.close")) { dismiss() }
                    }
                }
        }
    }

    /// Returns owns its own `List`; every other case is a card stack in a scroll.
    @ViewBuilder private var container: some View {
        if case let .returns(from, to) = request {
            FinReturnsBreakdown(from: from, to: to)
        } else {
            ScrollView { content.padding() }
        }
    }

    @ViewBuilder private var content: some View {
        switch request {
        case .returns:
            EmptyView()
        case let .noi(from, to):
            NoiBreakdownView(from: from, to: to)
        case let .model(from, to, measure):
            ModelBreakdownView(from: from, to: to, measure: measure)
        case let .salesRow(row):
            FinDetailCard(items: [
                (i18n.t("dashboard.revenue"), reportMoney(row.revenue)),
                (i18n.t("dashboard.cogs"), reportMoney(row.cogs)),
                (i18n.t("dashboard.grossProfit"), reportMoney(row.grossProfit)),
                (i18n.t("dashboard.unitsSold"), "\(row.unitsSold)"),
                (i18n.t("reports.share"), "\(Int((row.share * 100).rounded()))%"),
            ], title: row.label)
        case let .partner(row):
            FinDetailCard(items: [
                (i18n.t("reports.outstanding"), reportMoney(row.outstanding)),
                (i18n.t("reports.settled"), reportMoney(row.settledRevenue)),
                (i18n.t("reports.overdueCount"), "\(row.overdueCount)"),
            ], title: row.shopName)
        case let .inventoryModel(row):
            FinDetailCard(items: [
                (i18n.t("reports.units"), "\(row.units)"),
                (i18n.t("reports.landedValue"), reportMoney(row.landedValue)),
                (i18n.t("reports.ageBucket"), "\(Int(row.avgDaysInStock.rounded()))\(i18n.t("reports.daysShort"))"),
            ], title: row.label)
        }
    }
}

/// A titled key/value card for zero-fetch drill-down detail.
struct FinDetailCard: View {
    let items: [(String, String)]
    let title: String

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: 10) {
                Text(title).font(.headline)
                Divider()
                ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                    HStack {
                        Text(item.0).font(.subheadline).foregroundStyle(.secondary)
                        Spacer()
                        Text(item.1).font(.mono(15))
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

/// Net operating income waterfall (web `NoiBreakdown`): revenue − COGS −
/// expenses = NOI, fetched from `/reports/profit`.
private struct NoiBreakdownView: View {
    let from: Date?
    let to: Date?
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var report: ProfitReport?

    var body: some View {
        Group {
            if let report {
                FinDetailCard(items: [
                    (i18n.t("dashboard.revenue"), reportMoney(report.revenue)),
                    ("− \(i18n.t("dashboard.cogs"))", reportMoney(report.cogs)),
                    ("− \(i18n.t("dashboard.expenses"))", reportMoney(report.expenses)),
                    ("= \(i18n.t("dashboard.netOperatingIncome"))",
                     reportMoney(report.netOperatingIncome)),
                ], title: i18n.t("dashboard.netOperatingIncome"))
            } else {
                LoadingView().frame(height: 160)
            }
        }
        .task { report = try? await ReportsRepository(api: container.api).profit(from: from, to: to) }
    }
}

/// By-model ranking for gross profit or units (web `ModelMeasureBreakdown`).
private struct ModelBreakdownView: View {
    let from: Date?
    let to: Date?
    let measure: FinModelMeasure
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var rows: [FinBreakdownRow]?

    private func value(_ r: FinBreakdownRow) -> Double {
        measure == .units ? Double(r.unitsSold) : r.grossProfit
    }

    var body: some View {
        Group {
            if let rows {
                if rows.isEmpty {
                    EmptyStateView(systemImage: "chart.bar", title: i18n.t("reports.empty"))
                } else {
                    let total = max(1, rows.reduce(0.0) { $0 + value($1) })
                    FinShareList(rows: rows.map {
                        FinShareRow(
                            key: $0.key, label: $0.label,
                            value: measure == .units ? "\($0.unitsSold)" : reportMoney($0.grossProfit),
                            share: value($0) / total
                        )
                    })
                }
            } else {
                LoadingView().frame(height: 160)
            }
        }
        .task {
            rows = (try? await ReportsRepository(api: container.api)
                .profitBreakdown(groupBy: "model", from: from, to: to)) ?? []
        }
    }
}
