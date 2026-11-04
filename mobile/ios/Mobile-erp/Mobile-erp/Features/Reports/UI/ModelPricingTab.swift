import SwiftUI

/// Model pricing & margins over a rolling 90-day window: models ranked by
/// average selling price as labelled bars, then one card per model/storage
/// with keyed facts. Acquisition cost
/// and margin appear only with `device.cost.view`.
struct ModelPricingTab: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var rows: [ModelPricingRow]?
    @State private var labels: [String: String] = [:]
    @State private var error: String?

    private var canCost: Bool { container.session.can("device.cost.view") }
    private func name(_ r: ModelPricingRow) -> String { labels[r.modelId] ?? r.modelId }

    var body: some View {
        ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                if let error, rows == nil {
                    AppCard { ErrorStateView(message: error) { Task { await load() } } }
                } else if let rows {
                    if rows.isEmpty {
                        AppCard { EmptyStateView(systemImage: "tag", title: i18n.t("reports.empty")) }
                    } else {
                        // Ranked by average selling price; the bar is the price against the dearest model.
                        let top = rows.map { $0.avgSellingPrice ?? 0 }.max() ?? 1
                        FinBreakdownBars(title: i18n.t("dashboard.avgSellingPrice"), rows: rows.sorted { ($0.avgSellingPrice ?? 0) > ($1.avgSellingPrice ?? 0) }.prefix(8).map {
                            FinShareRow(key: $0.id, label: "\(name($0)) \($0.storage ?? "")", value: reportMoney($0.avgSellingPrice),
                                        share: ($0.avgSellingPrice ?? 0) / max(top, 1))
                        }, showsShare: false)
                        ForEach(rows) { row in PricingCard(row: row, name: name(row), canCost: canCost) }
                    }
                } else {
                    AppCard { LoadingView().frame(height: 160) }
                }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.bottom, Tokens.Space.lg)
        }
        .task { await load() }
    }

    private func load() async {
        error = nil
        let repo = ReportsRepository(api: container.api)
        if labels.isEmpty { labels = await repo.deviceModelLabels() }
        do { rows = try await repo.modelPricing() }
        catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }
}

/// One model's pricing: name + mono storage, stock/sold caption, keyed facts.
private struct PricingCard: View {
    let row: ModelPricingRow
    let name: String
    let canCost: Bool
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(name).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                    if let storage = row.storage { Text(storage).font(.data(.regular)).foregroundStyle(Tokens.muted) }
                    Text("\(i18n.t("dashboard.unitsInStock")) \(row.unitsInStock) · \(i18n.t("dashboard.unitsSold")) \(row.unitsSold)")
                        .font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                VStack(spacing: 0) {
                    if canCost {
                        FactRow(label: i18n.t("dashboard.avgAcquisitionCost")) { Text(reportMoney(row.avgAcquisitionCost)).font(.data(.regular)) }
                    }
                    FactRow(label: i18n.t("dashboard.avgSellingPrice"), last: !canCost) { Text(reportMoney(row.avgSellingPrice)).font(.data(.regular)) }
                    if canCost {
                        FactRow(label: i18n.t("reports.margin"), last: true) {
                            if let selling = row.avgSellingPrice, let cost = row.avgAcquisitionCost, selling > 0 {
                                let spread = selling - cost
                                Text("\(reportMoney(spread)) · \(String(format: "%.1f", spread / selling * 100))%")
                                    .font(.data(.regular)).foregroundStyle(spread >= 0 ? Tokens.success : Tokens.danger)
                            } else {
                                Text("—").font(.data(.regular))
                            }
                        }
                    }
                }
            }
        }
    }
}
