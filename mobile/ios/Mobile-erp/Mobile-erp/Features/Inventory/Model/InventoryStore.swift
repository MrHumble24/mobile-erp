import Foundation
import Observation

/// Slice-local server-state for the online bits the inventory tabs share: the
/// device-model catalog (filter dropdown, models tab, rule form) and the
/// low-stock rows (metrics bar + alerts tab). One fetch per concern instead of
/// each tab reloading it. The offline device list is read separately via
/// `@Query` on the SwiftData cache.
@MainActor
@Observable
final class InventoryStore {
    private let modelsRepo: DeviceModelRepository
    private let alertsRepo: StockAlertRepository

    var deviceModels: [DeviceModelView] = []
    var lowStock: [LowStockView] = []
    var modelsError: String?

    init(_ container: AppContainer) {
        modelsRepo = DeviceModelRepository(container)
        alertsRepo = StockAlertRepository(container)
    }

    func modelLabel(_ id: String) -> String {
        deviceModels.first { $0.id == id }?.label ?? id
    }

    func loadModels() async {
        do {
            deviceModels = try await modelsRepo.list()
            modelsError = nil
        } catch let error as AppError {
            modelsError = error.message
        } catch {
            modelsError = error.localizedDescription
        }
    }

    func loadLowStock() async {
        lowStock = (try? await alertsRepo.lowStock()) ?? lowStock
    }
}
