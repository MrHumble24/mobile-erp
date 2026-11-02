import Foundation
import Observation

/// Sales list state: the filters and the loaded page. Reads are online-only
/// (sales are not in the offline feed); offline shows a needs-connection note.
@MainActor
@Observable
final class SalesListModel {
    var filters = SaleFilters()
    var page: SalesPage?
    var loading = false
    var errorMessage: String?
    var offline = false

    @ObservationIgnored private var container: AppContainer?
    private var repo: SalesRepository {
        SalesRepository(api: container!.api, context: container!.modelContext)
    }

    func configure(_ container: AppContainer) {
        guard self.container == nil else { return }
        self.container = container
    }

    func reload() {
        guard let container else { return }
        guard container.connectivity.isOnline else {
            offline = true
            page = nil
            return
        }
        offline = false
        loading = true
        errorMessage = nil
        let filters = self.filters
        Task {
            do {
                page = try await repo.list(filters)
            } catch let error as AppError {
                errorMessage = error.message
            } catch {
                errorMessage = error.localizedDescription
            }
            loading = false
        }
    }
}
