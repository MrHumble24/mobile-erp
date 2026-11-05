import Foundation
import Observation

/// The storage × level price matrix of one product (ADR 0034), loaded from and
/// saved to `/pricing/products/:modelId` in one call. A quantity product has
/// only the "any storage" row; a phone adds a row per storage it is sold in
/// (the storages come from the model's `storage` attribute options plus any
/// already-priced storage). Money is kept as the raw field text until save.
@MainActor
@Observable
final class PricingProductModel {
    let modelId: String
    let isQuantity: Bool

    /// Ordered storage keys, "" (any storage) first.
    private(set) var storages: [String] = [""]
    /// storageKey → levelCode → field text.
    var cells: [String: [String: String]] = [:]
    private(set) var loading = false
    var saving = false
    var error: String?

    @ObservationIgnored private let repo: PricingRepository
    @ObservationIgnored private let storageOptions: [String]

    init(modelId: String, isQuantity: Bool, storageOptions: [String], repo: PricingRepository) {
        self.modelId = modelId
        self.isQuantity = isQuantity
        self.storageOptions = storageOptions
        self.repo = repo
    }

    /// The field binding text for a storage × level cell.
    func text(_ storage: String, _ level: String) -> String { cells[storage]?[level] ?? "" }

    func setText(_ storage: String, _ level: String, _ value: String) {
        cells[storage, default: [:]][level] = value
    }

    func load() async {
        loading = true
        error = nil
        defer { loading = false }
        do {
            let view = try await repo.productPrices(modelId)
            var found: Set<String> = []
            for row in view.prices {
                let key = row.storageKey
                if !key.isEmpty { found.insert(key) }
                if let price = row.price { cells[key, default: [:]][row.levelCode] = price }
            }
            storages = rowOrder(extra: found)
        } catch let e as AppError {
            error = e.message
        } catch {
            self.error = nil
        }
    }

    func save() async -> Bool {
        saving = true
        error = nil
        defer { saving = false }
        var entries: [(storage: String, levelCode: String, price: Decimal?)] = []
        for storage in storages {
            for level in PriceLevels.all {
                let raw = text(storage, level).trimmingCharacters(in: .whitespaces)
                entries.append((storage, level, raw.isEmpty ? nil : Decimal(string: raw)))
            }
        }
        do {
            try await repo.setProductPrices(modelId, entries)
            return true
        } catch let e as AppError {
            error = e.message
            return false
        } catch {
            self.error = nil
            return false
        }
    }

    /// Row order: any storage, then the model's storage options and any
    /// already-priced storage, de-duplicated and sorted. Quantity → any only.
    private func rowOrder(extra: Set<String>) -> [String] {
        guard !isQuantity else { return [""] }
        var set = Set(storageOptions.map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty })
        set.formUnion(extra)
        return [""] + set.sorted { $0.localizedStandardCompare($1) == .orderedAscending }
    }
}
