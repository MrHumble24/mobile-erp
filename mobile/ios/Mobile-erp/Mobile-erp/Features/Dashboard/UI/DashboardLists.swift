import SwiftUI

/// Low-stock alerts (`/stock-alert-rules/low-stock`, perm `device.read`).
struct LowStockCard: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    let labels: [String: String]
    @State private var rows: [LowStockItem] = []
    @State private var state: DashLoad = .loading

    var body: some View {
        DashSection(title: i18n.t("dashboard.lowStockTitle"), state: state,
                    retry: { Task { await load() } }) {
            if rows.isEmpty {
                DashEmptyRow()
            } else {
                ForEach(rows) { row in
                    HStack(spacing: Tokens.Space.sm) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(labels[row.modelId] ?? row.modelId)
                                .font(.ui(.body))
                                .foregroundStyle(Tokens.text)
                            if let s = row.storage, !s.isEmpty {
                                Text(s).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                            }
                        }
                        Spacer(minLength: Tokens.Space.sm)
                        StatusBadge("\(row.currentCount)", color: Tokens.danger)
                        Text("/ \(row.threshold)")
                            .font(.data(.regular))
                            .foregroundStyle(Tokens.muted)
                    }
                    .frame(minHeight: Tokens.Space.rowH)
                }
            }
        }
        .task { await load() }
    }

    private func load() async {
        do { rows = try await DashboardRepository(api: container.api).lowStock(); state = .loaded }
        catch let e as AppError { state = .failed(e.message) }
        catch { state = .failed(error.localizedDescription) }
    }
}

/// Overdue consignments (`/consignments/overdue`, perm `consignment.read`).
struct OverdueCard: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var rows: [OverdueConsignment] = []
    @State private var state: DashLoad = .loading

    var body: some View {
        DashSection(title: i18n.t("dashboard.overdueConsignmentsTitle"), state: state,
                    retry: { Task { await load() } }) {
            if rows.isEmpty {
                DashEmptyRow()
            } else {
                ForEach(rows) { row in
                    HStack(spacing: Tokens.Space.sm) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(row.partnerShopName)
                                .font(.ui(.body))
                                .foregroundStyle(Tokens.text)
                            Text(row.unitCode).font(.data(.regular)).foregroundStyle(Tokens.muted)
                        }
                        Spacer(minLength: Tokens.Space.sm)
                        MoneyText(value: row.agreedPrice, size: 15)
                            .foregroundStyle(Tokens.text)
                        StatusBadge(row.dueDisplay, color: Tokens.danger)
                    }
                    .frame(minHeight: Tokens.Space.rowH)
                }
            }
        }
        .task { await load() }
    }

    private func load() async {
        do { rows = try await DashboardRepository(api: container.api).overdue(); state = .loaded }
        catch let e as AppError { state = .failed(e.message) }
        catch { state = .failed(error.localizedDescription) }
    }
}
