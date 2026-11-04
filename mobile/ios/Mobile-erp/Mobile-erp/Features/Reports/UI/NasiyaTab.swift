import SwiftUI

/// Nasiya (consignment) report: movement list-card + outstanding by partner;
/// a partner row drills into its outstanding/overdue detail.
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
            VStack(spacing: Tokens.Space.lg) {
                if let error, report == nil {
                    AppCard { ErrorStateView(message: error) { Task { await load() } } }
                } else if let report {
                    MetricList(rows: [
                        MetricRow(label: i18n.t("reports.outstandingTotal"), value: reportMoney(report.outstandingTotal), emphasis: Tokens.danger),
                        MetricRow(label: i18n.t("reports.overdueCount"), value: "\(report.overdueCount)",
                                  emphasis: report.overdueCount > 0 ? Tokens.danger : nil),
                        MetricRow(label: i18n.t("reports.created"), value: "\(report.createdCount)"),
                        MetricRow(label: i18n.t("reports.settled"), value: "\(report.settledCount)", subtext: reportMoney(report.settledRevenue)),
                        MetricRow(label: i18n.t("reports.returned"), value: "\(report.returnedCount)"),
                    ])
                    let total = report.outstandingTotal > 0 ? report.outstandingTotal : 1
                    FinBreakdownBars(title: i18n.t("reports.outstandingByPartner"), rows: report.byPartner.map {
                        FinShareRow(key: $0.partnerId, label: $0.shopName, value: reportMoney($0.outstanding), share: $0.outstanding / total)
                    }, onSelect: { id in
                        if let row = report.byPartner.first(where: { $0.partnerId == id }) { onBreakdown(.partner(row)) }
                    })
                } else {
                    AppCard { LoadingView().frame(height: 160) }
                }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.bottom, Tokens.Space.lg)
        }
        .task(id: key) { await load() }
    }

    private var key: String { "\(from?.timeIntervalSince1970 ?? 0)-\(to?.timeIntervalSince1970 ?? 0)" }

    private func load() async {
        error = nil
        do { report = try await ReportsRepository(api: container.api).consignments(from: from, to: to) }
        catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }
}
