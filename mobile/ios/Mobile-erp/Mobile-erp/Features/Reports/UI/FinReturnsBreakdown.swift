import SwiftUI

/// Paginated refunded-returns rows (`/reports/returns`) with load-more, as
/// hairline rows inside the drill-down sheet.
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
                    Text(i18n.t("reports.empty")).font(.ui(.body)).foregroundStyle(Tokens.muted)
                } else {
                    VStack(spacing: 0) {
                        ForEach(Array(pager.items.enumerated()), id: \.element.id) { i, row in
                            ReturnRowView(row: row)
                            if i < pager.items.count - 1 { Divider().overlay(Tokens.border) }
                        }
                    }
                    KitLoadMoreFooter(pager: pager)
                }
            } else {
                LoadingView().frame(height: 120)
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
        HStack(alignment: .top, spacing: Tokens.Space.sm) {
            VStack(alignment: .leading, spacing: 2) {
                Text(row.model).font(.ui(.body)).foregroundStyle(Tokens.text)
                Text(row.unitCode).font(.data(.regular)).foregroundStyle(Tokens.text)
                if let reason = row.reason, !reason.isEmpty {
                    Text(reason).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
            }
            Spacer(minLength: Tokens.Space.sm)
            VStack(alignment: .trailing, spacing: 2) {
                MoneyText(value: String(row.refundAmount), size: 15).fontWeight(.semibold).foregroundStyle(Tokens.danger)
                Text(KitDate.day(row.returnedAt)).font(.ui(.caption)).foregroundStyle(Tokens.muted)
            }
        }
        .padding(.vertical, Tokens.Space.sm)
    }
}
