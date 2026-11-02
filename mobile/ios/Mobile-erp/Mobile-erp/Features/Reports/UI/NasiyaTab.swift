import SwiftUI

/// Nasiya (consignment) report: movement tiles + outstanding-by-partner
/// breakdown; a partner row drills into its outstanding/overdue detail.
struct FinNasiyaTab: View {
    let from: Date?
    let to: Date?
    let onBreakdown: (FinBreakdownRequest) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var report: ConsignmentsReport?
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if let error, report == nil {
                    ErrorStateView(message: error) { Task { await load() } }
                } else if let report {
                    MetricGrid(tiles: tiles(report))
                    partnerCard(report)
                } else {
                    LoadingView().frame(height: 200)
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .task(id: key) { await load() }
    }

    private var key: String { "\(from?.timeIntervalSince1970 ?? 0)-\(to?.timeIntervalSince1970 ?? 0)" }

    @ViewBuilder private func partnerCard(_ r: ConsignmentsReport) -> some View {
        let total = r.outstandingTotal > 0 ? r.outstandingTotal : 1
        BarChartCard(
            title: i18n.t("reports.outstandingByPartner"),
            data: r.byPartner.map { BarDatum(label: $0.shopName, value: $0.outstanding) }
        )
        if !r.byPartner.isEmpty {
            FinShareList(
                rows: r.byPartner.map {
                    FinShareRow(key: $0.partnerId, label: $0.shopName,
                                value: reportMoney($0.outstanding), share: $0.outstanding / total)
                },
                onSelect: { id in
                    if let row = r.byPartner.first(where: { $0.partnerId == id }) {
                        onBreakdown(.partner(row))
                    }
                }
            )
        }
    }

    private func load() async {
        error = nil
        do { report = try await ReportsRepository(api: container.api).consignments(from: from, to: to) }
        catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }

    private func tiles(_ r: ConsignmentsReport) -> [MetricTile] {
        [
            MetricTile(label: i18n.t("reports.created"), value: "\(r.createdCount)"),
            MetricTile(label: i18n.t("reports.settled"), value: "\(r.settledCount)"),
            MetricTile(label: i18n.t("reports.returned"), value: "\(r.returnedCount)"),
            MetricTile(label: i18n.t("reports.outstandingTotal"),
                       value: reportMoney(r.outstandingTotal), emphasis: Tokens.danger),
            MetricTile(label: i18n.t("reports.overdueCount"), value: "\(r.overdueCount)"),
        ]
    }
}
