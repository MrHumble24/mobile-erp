import SwiftUI
import Observation

/// Load-more pagination matching the server's `page`/`pageSize` + `{items,total}`
/// contract (1-based page, default size 50, response carries the total). The
/// model owns one fetch closure and accumulates pages; the view shows a footer
/// that triggers the next page.
///
///   let pager = KitPaginator<Sale> { page, size in
///       let resp = try await repo.list(filters, page: page, pageSize: size)
///       return (resp.items, resp.total)
///   }
///   .task { await pager.first() }        // or pager.refresh() on filter change
///   List {
///       ForEach(pager.items) { SaleRow($0) }
///       KitLoadMoreFooter(pager: pager)  // auto-loads when it scrolls into view
///   }
@Observable
@MainActor
final class KitPaginator<Item> {
    private(set) var items: [Item] = []
    private(set) var total = 0
    private(set) var isLoading = false
    private(set) var error: String?

    let pageSize: Int
    private var page = 0        // last loaded page; 0 = nothing yet
    private let fetch: (_ page: Int, _ pageSize: Int) async throws -> (items: [Item], total: Int)

    init(pageSize: Int = 50,
         fetch: @escaping (_ page: Int, _ pageSize: Int) async throws -> (items: [Item], total: Int)) {
        self.pageSize = pageSize
        self.fetch = fetch
    }

    /// More rows exist on the server than we hold (and we actually got the last page).
    var hasMore: Bool { page > 0 && items.count < total }

    /// Load the first page, replacing anything held. Idempotent while loading.
    func first() async {
        guard !isLoading else { return }
        page = 0
        items = []
        total = 0
        await loadNext()
    }

    /// Reset and reload — call when filters change.
    func refresh() async { await first() }

    /// Append the next page if there is one.
    func loadNext() async {
        guard !isLoading, page == 0 || hasMore else { return }
        isLoading = true
        error = nil
        let next = page + 1
        do {
            let result = try await fetch(next, pageSize)
            items.append(contentsOf: result.items)
            total = result.total
            page = next
        } catch {
            self.error = (error as? AppError)?.message ?? error.localizedDescription
        }
        isLoading = false
    }
}

/// List footer: a spinner while loading, else a "load more" row that fires when
/// it scrolls into view. Renders nothing once the full list is in hand.
struct KitLoadMoreFooter<Item>: View {
    @Environment(I18n.self) private var i18n
    let pager: KitPaginator<Item>

    var body: some View {
        Group {
            if pager.isLoading {
                ProgressView().frame(maxWidth: .infinity)
            } else if pager.hasMore {
                Button(i18n.t("common.loadMore", default: "Load more")) {
                    Task { await pager.loadNext() }
                }
                .frame(maxWidth: .infinity)
                .onAppear { Task { await pager.loadNext() } }
            }
        }
        .listRowSeparator(.hidden)
        .padding(.vertical, 8)
    }
}
