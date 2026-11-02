import SwiftUI

/// Management dashboard. Auth-only; each data card is gated by the permission
/// its endpoint needs, so a cashier sees nothing finance-related. Device-model
/// labels load once here and pass down (one shared read, not per card).
struct DashboardView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var labels: [String: String] = [:]

    private func can(_ code: String) -> Bool { container.session.can(code) }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                DashboardQuickActions()
                if can("report.finance") { DashboardKpiSection() }
                if can("device.read") { LowStockCard(labels: labels) }
                if can("consignment.read") { OverdueCard() }
                if can("report.finance") { DashboardPricingCard(labels: labels) }
                if !canSeeAnything {
                    EmptyStateView(systemImage: "square.grid.2x2",
                                   title: i18n.t("dashboard.title"),
                                   message: i18n.t("common.notFound"))
                }
            }
            .padding()
        }
        .navigationTitle(i18n.t("dashboard.title"))
        .background(Color(.systemGroupedBackground))
        .task {
            if labels.isEmpty {
                labels = await DashboardRepository(api: container.api).deviceModelLabels()
            }
        }
    }

    private var canSeeAnything: Bool {
        ["report.finance", "device.read", "consignment.read",
         "sale.create", "sale.read", "qc.read"].contains(where: can)
    }
}
