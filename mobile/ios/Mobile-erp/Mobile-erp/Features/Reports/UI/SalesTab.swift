import SwiftUI

/// Sales breakdown by channel / model / cashier / day. The model view drills
/// into one model's revenue, COGS, gross profit and units.
struct FinSalesTab: View {
    let from: Date?
    let to: Date?
    let onBreakdown: (FinBreakdownRequest) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var groupBy = "model"
    @State private var rows: [FinBreakdownRow]?
    @State private var error: String?

    private let groups = ["channel", "model", "cashier", "day"]

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Picker(i18n.t("reports.breakdownBy"), selection: $groupBy) {
                    ForEach(groups, id: \.self) { g in Text(i18n.t("reports.group_\(g)")).tag(g) }
                }
                .pickerStyle(.segmented)
                content
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .task(id: key) { await load() }
    }

    private var key: String { "\(from?.timeIntervalSince1970 ?? 0)-\(to?.timeIntervalSince1970 ?? 0)-\(groupBy)" }

    @ViewBuilder private var content: some View {
        if let error, rows == nil {
            ErrorStateView(message: error) { Task { await load() } }
        } else if let rows {
            if rows.isEmpty {
                EmptyStateView(systemImage: "chart.bar", title: i18n.t("reports.empty"))
            } else {
                BarChartCard(
                    title: i18n.t("reports.salesBreakdownTitle"),
                    data: rows.map { BarDatum(label: $0.label, value: $0.revenue) }
                )
                FinShareList(
                    rows: rows.map {
                        FinShareRow(key: $0.key, label: $0.label,
                                    value: reportMoney($0.revenue), share: $0.share)
                    },
                    onSelect: modelSelect
                )
            }
        } else {
            LoadingView().frame(height: 200)
        }
    }

    private var modelSelect: ((String) -> Void)? {
        guard groupBy == "model" else { return nil }
        return { key in
            guard let row = rows?.first(where: { $0.key == key }) else { return }
            onBreakdown(.salesRow(row))
        }
    }

    private func load() async {
        error = nil
        do { rows = try await ReportsRepository(api: container.api)
            .profitBreakdown(groupBy: groupBy, from: from, to: to) }
        catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }
}
