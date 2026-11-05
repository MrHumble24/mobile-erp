import Foundation
import Observation

/// Till catalog state (ADR 0031): the search text + category filter, the loaded
/// product cards, and the category chips. Reads the catalog online and falls back
/// to the synced cache offline. Tap rules live in `CatalogPick`; this only loads.
@MainActor
@Observable
final class CatalogBrowser {
    var search = "" { didSet { if search != oldValue { scheduleReload() } } }
    var categoryId: String? { didSet { if categoryId != oldValue { Task { await load() } } } }
    private(set) var entries: [CatalogEntry] = []
    private(set) var categories: [ProductCategory] = []
    private(set) var loading = false
    private(set) var loadError: String?

    @ObservationIgnored private var container: AppContainer?
    @ObservationIgnored private var reloadTask: Task<Void, Never>?

    private var repo: CatalogRepository {
        CatalogRepository(context: container!.modelContext, api: container!.api,
                          isOnline: container!.connectivity.isOnline)
    }

    func configure(_ container: AppContainer) {
        guard self.container == nil else { return }
        self.container = container
    }

    func load() async {
        guard container != nil else { return }
        loading = true
        loadError = nil
        do {
            entries = try await repo.list(categoryId: categoryId, search: search)
        } catch let e as AppError {
            loadError = e.message
        } catch {
            loadError = container?.i18n.t("common.error")
        }
        loading = false
    }

    /// Best-effort categories for the chips (online; cached for offline reuse).
    func loadCategories() async {
        guard let container else { return }
        categories = (try? await ProductCategoryRepository(container).list()) ?? categories
    }

    /// The in-stock units of a unit product, for the tap rules (fetched on tap).
    func units(for entry: CatalogEntry) async -> [CatalogUnit] {
        (try? await repo.units(modelId: entry.modelId)) ?? []
    }

    private func scheduleReload() {
        reloadTask?.cancel()
        reloadTask = Task { [weak self] in
            try? await Task.sleep(for: .milliseconds(300))
            guard let self, !Task.isCancelled else { return }
            await self.load()
        }
    }
}
