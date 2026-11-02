import SwiftUI

/// Inventory snapshot: stock tiles + by-status, by-model (drill-down) and
/// stock-aging breakdowns. Landed value is shown only with `device.cost.view`.
struct FinInventoryTab: View {
    let canViewCost: Bool
    let onBreakdown: (FinBreakdownRequest) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var report: InventoryReport?
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if let error, report == nil {
                    ErrorStateView(message: error) { Task { await load() } }
                } else if let report {
                    MetricGrid(tiles: tiles(report))
                    statusCard(report)
                    modelCard(report)
                    agingCard(report)
                } else {
                    LoadingView().frame(height: 200)
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .task { await load() }
    }

    @ViewBuilder private func statusCard(_ r: InventoryReport) -> some View {
        BarChartCard(title: i18n.t("reports.byStatus"),
                     data: r.byStatus.map { BarDatum(label: $0.label, value: Double($0.count)) })
    }

    @ViewBuilder private func modelCard(_ r: InventoryReport) -> some View {
        let total = Double(max(1, r.byModel.reduce(0) { $0 + $1.units }))
        BarChartCard(title: i18n.t("reports.byModel"),
                     data: r.byModel.map { BarDatum(label: $0.label, value: Double($0.units)) })
        if !r.byModel.isEmpty {
            FinShareList(
                rows: r.byModel.map {
                    FinShareRow(key: $0.modelId, label: $0.label,
                                value: "\($0.units)", share: Double($0.units) / total)
                },
                onSelect: { id in
                    if let row = r.byModel.first(where: { $0.modelId == id }) {
                        onBreakdown(.inventoryModel(row))
                    }
                }
            )
        }
    }

    @ViewBuilder private func agingCard(_ r: InventoryReport) -> some View {
        BarChartCard(title: i18n.t("reports.aging"),
                     data: r.aging.map { BarDatum(label: $0.bucket, value: Double($0.units)) })
    }

    private func load() async {
        error = nil
        do { report = try await ReportsRepository(api: container.api).inventory() }
        catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }

    private func tiles(_ r: InventoryReport) -> [MetricTile] {
        var tiles = [MetricTile(label: i18n.t("dashboard.unitsInStock"), value: "\(r.inStockUnits)")]
        if canViewCost {
            tiles.append(MetricTile(label: i18n.t("reports.landedValue"),
                                    value: reportMoney(r.inStockLandedValue), emphasis: Tokens.ink))
        }
        tiles.append(MetricTile(label: i18n.t("reports.defective"), value: "\(r.defectiveUnits)"))
        tiles.append(MetricTile(label: i18n.t("reports.consigned"), value: "\(r.consignedUnits)"))
        return tiles
    }
}
