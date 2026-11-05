import Foundation
import Observation

/// Stock screen state: the quantity products with their levels, a category
/// filter and a name/barcode/model-code search. Server state, loaded online;
/// permissions decide whether cost fields and the adjust actions are shown.
@MainActor
@Observable
final class StockListModel {
    var items: [StockLevel] = []
    var categories: [ProductCategory] = []
    var categoryId: String?
    var search = ""
    var loading = false
    var error: String?

    private(set) var canViewCost = false
    private(set) var canAdjust = false
    private(set) var online = true

    @ObservationIgnored private var container: AppContainer?
    private var repo: StockRepository { StockRepository(api: container!.api) }

    func configure(_ container: AppContainer) {
        guard self.container == nil else { return }
        self.container = container
        canViewCost = container.session.can("device.cost.view")
        canAdjust = container.session.can("stock.adjust")
        online = container.connectivity.isOnline
    }

    func reload() {
        guard let container else { return }
        online = container.connectivity.isOnline
        guard online else { items = []; return }
        loading = true
        error = nil
        Task {
            do {
                items = try await repo.list(categoryId: categoryId, search: search)
            } catch let e as AppError {
                error = e.message
            } catch {
                self.error = container.i18n.t("common.error")
            }
            loading = false
        }
    }

    func loadCategories() {
        guard let container, categories.isEmpty else { return }
        Task { categories = (try? await ProductCategoryRepository(container).list()) ?? [] }
    }

    /// Total stock value across the loaded products (cost users only); nil when
    /// no value is available.
    var totalValue: String? {
        guard canViewCost else { return nil }
        let sum = items.reduce(Decimal.zero) { $0 + (Decimal(string: $1.value ?? "0") ?? .zero) }
        return NSDecimalNumber(decimal: sum).stringValue
    }
}
