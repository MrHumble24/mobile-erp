import SwiftUI

/// Expense analysis for the shared report range: group-by (category / month)
/// bar chart, a per-row table and a period total.
struct ExpensesReportTab: View {
    let from: Date?
    let to: Date?

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var groupBy = "category"
    @State private var rows: [ExpenseReportRow]?
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Picker(i18n.t("reports.groupBy"), selection: $groupBy) {
                    Text(i18n.t("reports.groupByCategory")).tag("category")
                    Text(i18n.t("reports.groupByMonth")).tag("month")
                }
                .pickerStyle(.segmented)

                if let error, rows == nil {
                    ErrorStateView(message: error) { Task { await load() } }
                } else if let rows {
                    body(rows)
                } else {
                    LoadingView().frame(height: 200)
                }
            }
            .padding()
        }
        .background(Tokens.bg)
        .task(id: key) { await load() }
    }

    private var key: String { "\(from?.timeIntervalSince1970 ?? 0)-\(to?.timeIntervalSince1970 ?? 0)-\(groupBy)" }

    @ViewBuilder private func body(_ rows: [ExpenseReportRow]) -> some View {
        if rows.isEmpty {
            EmptyStateView(systemImage: "chart.pie", title: i18n.t("reports.empty"))
        } else {
            BarChartCard(
                title: i18n.t("reports.tabExpenses"),
                data: rows.map { BarDatum(label: $0.label, value: $0.total) }
            )
            AppCard {
                VStack(spacing: 10) {
                    ForEach(rows) { row in
                        HStack {
                            Text(row.label)
                            Spacer()
                            MoneyText(value: String(row.total), size: 15)
                        }
                    }
                    Divider()
                    HStack {
                        Text(i18n.t("common.total")).fontWeight(.semibold)
                        Spacer()
                        MoneyText(value: String(rows.reduce(0) { $0 + $1.total }), size: 16)
                    }
                }
            }
        }
    }

    private func load() async {
        error = nil
        do {
            rows = try await ReportsRepository(api: container.api)
                .expenses(from: from, to: to, groupBy: groupBy)
        } catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }
}
