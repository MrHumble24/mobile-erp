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
        .background(Tokens.bg)
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
        AppCard(padding: 16) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(name)
                            .font(.headline)
                            .foregroundStyle(Tokens.ink)
                        if let storage = row.storage {
                            Text(storage)
                                .font(.mono(12))
                                .foregroundStyle(.secondary)
                        }
                    }
                    Spacer()
                    HStack(spacing: 8) {
                        stat(i18n.t("dashboard.unitsInStock", default: "In Stock"), "\(row.unitsInStock)")
                        stat(i18n.t("dashboard.unitsSold", default: "Sold"), "\(row.unitsSold)")
                    }
                }

                Divider()

                VStack(spacing: 6) {
                    if canCost {
                        priceRow(i18n.t("dashboard.avgAcquisitionCost", default: "Avg Cost (Landed)"),
                                 row.avgAcquisitionCost,
                                 color: .secondary)
                    }
                    priceRow(i18n.t("dashboard.avgSellingPrice", default: "Avg Selling Price"),
                             row.avgSellingPrice,
                             color: Tokens.ink)

                    if canCost, let selling = row.avgSellingPrice, let cost = row.avgAcquisitionCost, selling > 0 {
                        let spread = selling - cost
                        let marginPct = (spread / selling) * 100
                        HStack {
                            Text(i18n.t("dashboard.grossMargin", default: "Estimated Margin"))
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(spread >= 0 ? Tokens.success : Tokens.danger)
                            Spacer()
                            Text("\(reportMoney(spread)) (\(String(format: "%.1f", marginPct))%)")
                                .font(.mono(14, weight: .bold))
                                .foregroundStyle(spread >= 0 ? Tokens.success : Tokens.danger)
                        }
                        .padding(.top, 2)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func stat(_ label: String, _ value: String) -> some View {
        VStack(alignment: .trailing, spacing: 2) {
            Text(label).font(.system(size: 10, weight: .medium)).foregroundStyle(.secondary)
            Text(value).font(.subheadline.weight(.bold)).monospacedDigit().foregroundStyle(Tokens.ink)
        }
    }

    private func priceRow(_ label: String, _ value: Double?, color: Color) -> some View {
        HStack {
            Text(label).font(.subheadline).foregroundStyle(.secondary)
            Spacer()
            Text(reportMoney(value)).font(.mono(15, weight: .medium)).foregroundStyle(color)
        }
    }
}
