import SwiftUI

/// Model pricing & margins (`/reports/model-pricing`, perm `report.finance`).
/// The acquisition-cost figure needs `device.cost.view`; hidden otherwise.
struct DashboardPricingCard: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    let labels: [String: String]
    @State private var rows: [DashPricingRow] = []
    @State private var state: DashLoad = .loading

    private var canCost: Bool { container.session.can("device.cost.view") }

    var body: some View {
        DashSection(title: i18n.t("dashboard.modelPricingTitle"), state: state,
                    retry: { Task { await load() } }) {
            if rows.isEmpty {
                Text(i18n.t("common.notFound")).font(.subheadline).foregroundStyle(.secondary)
            } else {
                ForEach(rows) { row in
                    VStack(spacing: 4) {
                        HStack {
                            Text(labels[row.modelId] ?? row.modelId)
                            if let s = row.storage, !s.isEmpty {
                                Text(s).font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text("\(row.unitsInStock) / \(row.unitsSold)")
                                .font(.caption).foregroundStyle(.secondary)
                        }
                        HStack {
                            if canCost {
                                label(i18n.t("dashboard.avgAcquisitionCost"), row.avgAcquisitionCost)
                                Spacer()
                            }
                            label(i18n.t("dashboard.avgSellingPrice"), row.avgSellingPrice)
                        }
                    }
                    if row.id != rows.last?.id { Divider() }
                }
            }
        }
        .task { await load() }
    }

    private func label(_ title: String, _ value: Double?) -> some View {
        HStack(spacing: 4) {
            Text(title).font(.caption2).foregroundStyle(.secondary)
            Text(dashMoney(value)).font(.mono(13))
        }
    }

    private func load() async {
        do { rows = try await DashboardRepository(api: container.api).modelPricing(); state = .loaded }
        catch let e as AppError { state = .failed(e.message) }
        catch { state = .failed(error.localizedDescription) }
    }
}
