import SwiftUI

/// Reports "Customs fees" tab (ADR 0027): pick a customs code and see its fee
/// over time as the same bar chart the other report tabs use (`BarChartCard`),
/// with the numbers listed below. Online-only; needs `customs.read`.
struct CustomsFeesTab: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var codes: [ReportCustomsCode] = []
    @State private var selected: String?
    @State private var points: [ReportFeePoint] = []
    @State private var loadingCodes = true
    @State private var loadingHistory = false
    @State private var error: String?

    private var repo: ReportsRepository { ReportsRepository(api: container.api) }

    var body: some View {
        ScrollView {
            VStack(spacing: Tokens.Space.md) {
                if loadingCodes {
                    LoadingView()
                } else if codes.isEmpty {
                    EmptyStateView(systemImage: "doc.text", title: i18n.t("customs.emptyList"))
                } else {
                    AppFormField(label: i18n.t("customs.pickCode")) {
                        AppSelect(placeholder: i18n.t("customs.pickCode"), selection: $selected,
                                  options: codes.map { (String?.some($0.customsCode), $0.label) })
                    }
                    .onChange(of: selected) { Task { await loadHistory() } }
                    chart
                    numbers
                }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.bottom, Tokens.Space.gutter)
        }
        .task {
            if loadingCodes {
                codes = await repo.customsCodes()
                selected = codes.first?.customsCode
                loadingCodes = false
                await loadHistory()
            }
        }
    }

    @ViewBuilder private var chart: some View {
        if loadingHistory {
            LoadingView()
        } else if let error {
            ErrorStateView(message: error, retry: { Task { await loadHistory() } })
        } else if selected != nil {
            BarChartCard(title: i18n.t("customs.history"), data: points.map {
                BarDatum(label: KitDate.day($0.effectiveAt), value: Double($0.fee) ?? 0)
            })
        }
    }

    @ViewBuilder private var numbers: some View {
        if !points.isEmpty {
            AppCard {
                VStack(spacing: 0) {
                    ForEach(Array(points.enumerated()), id: \.element.id) { i, p in
                        HStack {
                            Text(KitDate.day(p.effectiveAt)).font(.ui(.body)).foregroundStyle(Tokens.text)
                            Spacer()
                            MoneyText(value: p.fee, size: 15)
                        }
                        .padding(.vertical, Tokens.Space.sm)
                        if i < points.count - 1 { Divider().overlay(Tokens.border) }
                    }
                }
            }
        } else if selected != nil, !loadingHistory, error == nil {
            Text(i18n.t("customs.historyEmpty")).font(.ui(.body)).foregroundStyle(Tokens.muted)
                .frame(maxWidth: .infinity, minHeight: 80)
        }
    }

    private func loadHistory() async {
        guard let code = selected else { points = []; return }
        loadingHistory = true
        error = nil
        do {
            points = try await repo.customsFeeHistory(code)
        } catch let e as AppError {
            error = e.message
        } catch {
            self.error = error.localizedDescription
        }
        loadingHistory = false
    }
}
