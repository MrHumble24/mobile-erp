import SwiftUI

/// The customer credit report (ADR 0035): total left to pay, total overdue, and
/// the customers behind them. Reads `GET /credits/report` (`report.finance`).
struct CreditReportTab: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var report: CreditReport?
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                if let error, report == nil {
                    AppCard { ErrorStateView(message: error) { Task { await load() } } }
                } else if let report {
                    MetricList(rows: [
                        MetricRow(label: i18n.t("credit.totalOutstanding"),
                                  value: MoneyText.format(report.totalOutstanding),
                                  emphasis: (Decimal(string: report.totalOutstanding) ?? 0) > 0 ? Tokens.text : nil),
                        MetricRow(label: i18n.t("credit.totalOverdue"),
                                  value: MoneyText.format(report.totalOverdue),
                                  emphasis: (Decimal(string: report.totalOverdue) ?? 0) > 0 ? Tokens.danger : nil),
                    ])
                    if report.customers.isEmpty {
                        AppCard { EmptyStateView(systemImage: "banknote", title: i18n.t("credit.noCredits")) }
                    } else {
                        AppCard(padding: 0) {
                            VStack(spacing: 0) {
                                ForEach(Array(report.customers.enumerated()), id: \.element.id) { i, c in
                                    customerRow(c)
                                    if i < report.customers.count - 1 {
                                        Divider().overlay(Tokens.border).padding(.horizontal, Tokens.Space.cardPad)
                                    }
                                }
                            }
                        }
                    }
                } else {
                    AppCard { LoadingView().frame(height: 160) }
                }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.bottom, Tokens.Space.lg)
        }
        .task { if report == nil { await load() } }
    }

    private func customerRow(_ c: CreditReportCustomer) -> some View {
        HStack(alignment: .center, spacing: Tokens.Space.sm) {
            VStack(alignment: .leading, spacing: 2) {
                Text(c.name).font(.ui(.body)).foregroundStyle(Tokens.text)
                if (Decimal(string: c.overdueAmount) ?? 0) > 0 {
                    Text("\(i18n.t("credit.overdue")) \(MoneyText.format(c.overdueAmount))")
                        .font(.ui(.caption)).foregroundStyle(Tokens.danger)
                }
            }
            Spacer(minLength: Tokens.Space.sm)
            MoneyText(value: c.outstanding, size: 15).foregroundStyle(Tokens.text)
        }
        .frame(minHeight: Tokens.Space.rowH)
        .padding(.horizontal, Tokens.Space.cardPad)
        .padding(.vertical, Tokens.Space.sm)
    }

    private func load() async {
        error = nil
        do { report = try await CreditRepository(container).report() }
        catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }
}
