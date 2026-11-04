import SwiftUI

/// Inventory snapshot: stock list-card + by-status, by-model (drill-down) and
/// stock-aging breakdowns. Landed value only with `device.cost.view`.
struct FinInventoryTab: View {
    let canViewCost: Bool
    let onBreakdown: (FinBreakdownRequest) -> Void
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var report: InventoryReport?
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                if let error, report == nil {
                    AppCard { ErrorStateView(message: error) { Task { await load() } } }
                } else if let report {
                    MetricList(rows: rows(report))
                    FinBreakdownBars(title: i18n.t("reports.byStatus"), rows: share(report.byStatus.map { ($0.statusCode, $0.label, Double($0.count)) }))
                    FinBreakdownBars(title: i18n.t("reports.byModel"),
                                     rows: share(report.byModel.map { ($0.modelId, "\($0.label) · \(Int($0.avgDaysInStock.rounded()))\(i18n.t("reports.daysShort"))", Double($0.units)) }),
                                     onSelect: { id in
                                         if let row = report.byModel.first(where: { $0.modelId == id }) { onBreakdown(.inventoryModel(row)) }
                                     })
                    FinBreakdownBars(title: i18n.t("reports.aging"), rows: share(report.aging.map { ($0.bucket, $0.bucket, Double($0.units)) }))
                } else {
                    AppCard { LoadingView().frame(height: 160) }
                }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.bottom, Tokens.Space.lg)
        }
        .task { await load() }
    }

    /// Unit series carry no server share — derive it from the values.
    private func share(_ items: [(String, String, Double)]) -> [FinShareRow] {
        let total = max(1, items.reduce(0) { $0 + $1.2 })
        return items.map { FinShareRow(key: $0.0, label: $0.1, value: "\(Int($0.2))", share: $0.2 / total) }
    }

    private func load() async {
        error = nil
        do { report = try await ReportsRepository(api: container.api).inventory() }
        catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }

    private func rows(_ r: InventoryReport) -> [MetricRow] {
        var rows = [MetricRow(label: i18n.t("dashboard.unitsInStock"), value: "\(r.inStockUnits)")]
        if canViewCost { rows.append(MetricRow(label: i18n.t("reports.landedValue"), value: reportMoney(r.inStockLandedValue))) }
        rows.append(MetricRow(label: i18n.t("reports.defective"), value: "\(r.defectiveUnits)", emphasis: r.defectiveUnits > 0 ? Tokens.warning : nil))
        rows.append(MetricRow(label: i18n.t("reports.consigned"), value: "\(r.consignedUnits)"))
        return rows
    }
}
