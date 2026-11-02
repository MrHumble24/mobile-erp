import SwiftUI

/// Model pricing & margins over a rolling 90-day window. Acquisition cost is
/// shown only to users with `device.cost.view` (null → "—" otherwise).
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
            VStack(spacing: 16) {
                if let error, rows == nil {
                    ErrorStateView(message: error) { Task { await load() } }
                } else if let rows {
                    if rows.isEmpty {
                        EmptyStateView(systemImage: "tag", title: i18n.t("reports.empty"))
                    } else {
                        BarChartCard(
                            title: i18n.t("dashboard.avgSellingPrice"),
                            data: rows.prefix(8).map {
                                BarDatum(label: name($0), value: $0.avgSellingPrice ?? 0)
                            }
                        )
                        ForEach(rows) { row in PricingCard(row: row, name: name(row), canCost: canCost) }
                    }
                } else {
                    LoadingView().frame(height: 200)
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
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

/// One model's pricing row as a card (mobile-friendly vs. a wide table).
private struct PricingCard: View {
    let row: ModelPricingRow
    let name: String
    let canCost: Bool
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(name).font(.headline)
                    if let storage = row.storage {
                        StatusBadge(storage, color: Tokens.slate)
                    }
                }
                HStack {
                    stat(i18n.t("dashboard.unitsInStock"), "\(row.unitsInStock)")
                    Spacer()
                    stat(i18n.t("dashboard.unitsSold"), "\(row.unitsSold)")
                }
                Divider()
                if canCost {
                    priceRow(i18n.t("dashboard.avgAcquisitionCost"), row.avgAcquisitionCost)
                }
                priceRow(i18n.t("dashboard.avgSellingPrice"), row.avgSellingPrice)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func stat(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(value).font(.subheadline.weight(.medium)).monospacedDigit()
        }
    }
    private func priceRow(_ label: String, _ value: Double?) -> some View {
        HStack {
            Text(label).font(.subheadline).foregroundStyle(.secondary)
            Spacer()
            Text(reportMoney(value)).font(.mono(15))
        }
    }
}
