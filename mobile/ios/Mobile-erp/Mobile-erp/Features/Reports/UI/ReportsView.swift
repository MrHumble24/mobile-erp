import SwiftUI

/// Financial reports: Profit / Expenses / Model pricing / Daily closing. The
/// active report is the navigation title; tapping it opens a menu to switch
/// (stock `toolbarTitleMenu`, so the chrome stays glass). Each tab fetches on
/// its own via `report.finance`-gated endpoints.
struct ReportsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var tab: ReportTab = .profit

    var body: some View {
        content
            .navigationTitle(i18n.t(tab.labelKey))
            .navigationBarTitleDisplayMode(.inline)
            .toolbarTitleMenu {
                ForEach(ReportTab.allCases) { option in
                    Button { tab = option } label: {
                        Label(i18n.t(option.labelKey), systemImage: option.systemImage)
                    }
                }
            }
            .task {
                #if DEBUG
                _ = FinanceSelfCheck.run
                #endif
            }
    }

    @ViewBuilder private var content: some View {
        switch tab {
        case .profit: ProfitTab()
        case .expenses: ExpensesReportTab()
        case .modelPricing: ModelPricingTab()
        case .dailyClosing: DailyClosingTab()
        }
    }
}

enum ReportTab: String, CaseIterable, Identifiable {
    case profit, expenses, modelPricing, dailyClosing
    var id: String { rawValue }

    var labelKey: String {
        switch self {
        case .profit: "reports.tabProfit"
        case .expenses: "reports.tabExpenses"
        case .modelPricing: "reports.tabModelPricing"
        case .dailyClosing: "reports.tabDailyClosing"
        }
    }
    var systemImage: String {
        switch self {
        case .profit: "chart.line.uptrend.xyaxis"
        case .expenses: "chart.pie"
        case .modelPricing: "tag"
        case .dailyClosing: "calendar"
        }
    }
}
