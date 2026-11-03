import SwiftUI

/// Paginated refunded-returns list (`/reports/returns`) with load-more — the
/// web `ReturnsListBreakdown`, using `KitPaginator` + `KitLoadMoreFooter`.
struct FinReturnsBreakdown: View {
    let from: Date?
    let to: Date?
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var pager: KitPaginator<ReturnRow>?

    var body: some View {
        Group {
            if let pager {
                if let error = pager.error, pager.items.isEmpty {
                    ErrorStateView(message: error) { Task { await pager.first() } }
                } else if pager.items.isEmpty && !pager.isLoading {
                    EmptyStateView(systemImage: "arrow.uturn.backward", title: i18n.t("reports.empty"))
                } else {
                    List {
                        ForEach(pager.items) { row in ReturnRowView(row: row) }
                        KitLoadMoreFooter(pager: pager)
                    }
                    .listStyle(.insetGrouped)
                    .scrollContentBackground(.hidden)
                    .listRowBackground(Tokens.surface)
                    .background(Tokens.bg)
                }
            } else {
                LoadingView().frame(height: 160)
            }
        }
        .task { await start() }
    }

    private func start() async {
        guard pager == nil else { return }
        let repo = ReportsRepository(api: container.api)
        let pager = KitPaginator<ReturnRow> { page, size in
            let resp = try await repo.returns(from: from, to: to, page: page, pageSize: size)
            return (resp.items, resp.total)
        }
        self.pager = pager
        await pager.first()
    }
}

private struct ReturnRowView: View {
    let row: ReturnRow

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 3) {
                Text(row.model).font(.subheadline)
                Text(row.imei).font(.mono(12)).foregroundStyle(.secondary)
                if let reason = row.reason, !reason.isEmpty {
                    Text(reason).font(.caption).foregroundStyle(.secondary)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 3) {
                MoneyText(value: String(row.refundAmount), size: 14)
                    .foregroundStyle(Tokens.danger)
                Text(String(row.returnedAt.prefix(10))).font(.caption2).foregroundStyle(.secondary)
            }
        }
    }
}
