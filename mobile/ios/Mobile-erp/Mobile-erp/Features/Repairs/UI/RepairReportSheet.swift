import SwiftUI

/// Repairs figures (ADR 0040) from `GET /repairs/report`: income (always), and
/// parts cost / outside cost / profit (only with `device.cost.view`). An
/// optional date range; all-time by default.
struct RepairReportSheet: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var report: RepairReport?
    @State private var error: String?
    @State private var useRange = false
    @State private var from = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
    @State private var to = Date()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("repairs.reportTitle", default: "Repairs report")) { dismiss() }
                rangeCard
                if let report { figures(report) }
                else if let error { ErrorStateView(message: error) { load() } }
                else { LoadingView().frame(height: 120) }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Tokens.card)
        .presentationDetents([.medium, .large])
        .task { if report == nil { load() } }
    }

    private var rangeCard: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                Toggle(i18n.t("repairs.useRange", default: "Date range"), isOn: $useRange.animation())
                    .font(.ui(.body)).foregroundStyle(Tokens.text)
                    .onChange(of: useRange) { _, _ in load() }
                if useRange {
                    AppFormField(label: i18n.t("reports.dateFrom", default: "From")) {
                        AppDateField(date: Binding(get: { from }, set: { from = $0; load() }))
                    }
                    AppFormField(label: i18n.t("reports.dateTo", default: "To")) {
                        AppDateField(date: Binding(get: { to }, set: { to = $0; load() }))
                    }
                }
            }
        }
    }

    private func figures(_ r: RepairReport) -> some View {
        SummaryTileGrid {
            SummaryTile(label: i18n.t("repairs.income", default: "Income"), value: MoneyText.format(r.income))
            if let parts = r.partsCost {
                SummaryTile(label: i18n.t("repairs.partsCost", default: "Parts cost"), value: MoneyText.format(parts))
            }
            if let outside = r.outsideCost {
                SummaryTile(label: i18n.t("repairs.outsideCost", default: "Outside cost"), value: MoneyText.format(outside))
            }
            if let profit = r.profit {
                SummaryTile(label: i18n.t("repairs.profit", default: "Profit"), value: MoneyText.format(profit))
            }
        }
    }

    private func load() {
        error = nil
        Task {
            do { report = try await RepairsRepository(container).report(from: useRange ? from : nil, to: useRange ? to : nil) }
            catch let e as AppError { error = RepairError.message(e, i18n) }
            catch { self.error = error.localizedDescription }
        }
    }
}
