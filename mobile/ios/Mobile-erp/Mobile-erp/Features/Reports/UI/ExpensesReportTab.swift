import SwiftUI

/// Expense analysis for the shared period: period total, then the breakdown
/// by category or month behind the kit segmented control.
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
            VStack(spacing: Tokens.Space.lg) {
                SegmentedControl(selection: $groupBy, segments: [
                    ("category", i18n.t("reports.groupByCategory")),
                    ("month", i18n.t("reports.groupByMonth")),
                ])
                if let error, rows == nil {
                    AppCard { ErrorStateView(message: error) { Task { await load() } } }
                } else if let rows {
                    let total = rows.reduce(0) { $0 + $1.total }
                    MetricList(rows: [MetricRow(label: i18n.t("expenses.metricTotal"), value: reportMoney(total), emphasis: Tokens.danger)])
                    FinBreakdownBars(
                        title: i18n.t(groupBy == "category" ? "reports.expenseByCategory" : "reports.expenseBy_month"),
                        rows: rows.map { FinShareRow(key: $0.key, label: $0.label, value: reportMoney($0.total), share: total > 0 ? $0.total / total : 0) }
                    )
                } else {
                    AppCard { LoadingView().frame(height: 160) }
                }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.bottom, Tokens.Space.lg)
        }
        .task(id: key) { await load() }
    }

    private var key: String { "\(from?.timeIntervalSince1970 ?? 0)-\(to?.timeIntervalSince1970 ?? 0)-\(groupBy)" }

    private func load() async {
        error = nil
        do { rows = try await ReportsRepository(api: container.api).expenses(from: from, to: to, groupBy: groupBy) }
        catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }
}
