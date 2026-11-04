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
                DashEmptyRow()
            } else {
                ForEach(rows) { row in
                    VStack(spacing: Tokens.Space.xs) {
                        HStack(spacing: Tokens.Space.sm) {
                            Text(labels[row.modelId] ?? row.modelId)
                                .font(.ui(.body))
                                .foregroundStyle(Tokens.text)
                                .lineLimit(1)
                            if let s = row.storage, !s.isEmpty {
                                Text(s).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                            }
                            Spacer(minLength: Tokens.Space.sm)
                            Text("\(row.unitsInStock) / \(row.unitsSold)")
                                .font(.data(.regular)).foregroundStyle(Tokens.muted)
                        }
                        if canCost {
                            figure(i18n.t("dashboard.avgAcquisitionCost"), row.avgAcquisitionCost)
                        }
                        figure(i18n.t("dashboard.avgSellingPrice"), row.avgSellingPrice)
                    }
                    .padding(.vertical, Tokens.Space.xs)
                    if row.id != rows.last?.id { Divider().overlay(Tokens.border) }
                }
            }
        }
        .task { await load() }
    }

    /// One keyed figure per line (label left, mono value right) so a long Uzbek
    /// label never forces the amount to wrap mid-number.
    private func figure(_ title: String, _ value: Double?) -> some View {
        HStack(spacing: Tokens.Space.sm) {
            Text(title).font(.ui(.caption)).foregroundStyle(Tokens.muted)
            Spacer(minLength: Tokens.Space.sm)
            Text(dashMoney(value)).font(.data(.regular)).foregroundStyle(Tokens.text)
        }
    }

    private func load() async {
        do { rows = try await DashboardRepository(api: container.api).modelPricing(); state = .loaded }
        catch let e as AppError { state = .failed(e.message) }
        catch { state = .failed(error.localizedDescription) }
    }
}
