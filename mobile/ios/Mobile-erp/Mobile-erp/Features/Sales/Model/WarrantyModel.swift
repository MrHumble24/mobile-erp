import Foundation
import Observation

/// Warranty-lookup state. Online uses `GET /sales/warranty/:imei`; offline it
/// reconstructs from the cached device + latest sale. `nil` result = nothing
/// looked up yet; `notFound` = no sale for that IMEI.
@MainActor
@Observable
final class WarrantyModel {
    var result: WarrantyLookup?
    var loading = false
    var notFound = false

    @ObservationIgnored private var container: AppContainer?
    private var repo: SalesRepository {
        SalesRepository(api: container!.api, context: container!.modelContext)
    }

    func configure(_ container: AppContainer) {
        guard self.container == nil else { return }
        self.container = container
    }

    func clear() {
        result = nil
        loading = false
        notFound = false
    }

    func lookup(_ raw: String) {
        guard let container else { return }
        let imei = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !imei.isEmpty else { return }
        loading = true
        notFound = false
        result = nil

        if container.connectivity.isOnline {
            Task {
                do {
                    result = try await repo.warrantyOnline(imei)
                } catch {
                    // Fall back to the cache (e.g. a flaky connection), else 404.
                    if let cached = repo.warrantyOffline(imei) { result = cached }
                    else { notFound = true }
                }
                loading = false
            }
        } else {
            if let cached = repo.warrantyOffline(imei) { result = cached }
            else { notFound = true }
            loading = false
        }
    }
}
