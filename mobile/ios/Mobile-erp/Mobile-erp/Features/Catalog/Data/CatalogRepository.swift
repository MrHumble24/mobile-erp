import Foundation
import SwiftData

/// All data access for the till catalog grid (ADR 0031). Online: `GET /catalog`
/// and `GET /catalog/:modelId/units`. Offline (or on a network failure): the
/// synced device + product caches, built by `CatalogOffline`, so the seller can
/// still tap to sell. A real server error (4xx/5xx) is never masked by the cache.
@MainActor
struct CatalogRepository {
    let context: ModelContext
    let api: APIClient
    let isOnline: Bool

    func list(categoryId: String?, search: String?) async throws -> [CatalogEntry] {
        var query: [String: String] = [:]
        if let categoryId, !categoryId.isEmpty { query["categoryId"] = categoryId }
        let trimmed = (search ?? "").trimmingCharacters(in: .whitespaces)
        if !trimmed.isEmpty { query["search"] = trimmed }

        guard isOnline else { return offlineEntries(categoryId: categoryId, search: search) }
        do {
            return try await api.get("/catalog", query: query)
        } catch let e as AppError where e.isNetwork {
            return offlineEntries(categoryId: categoryId, search: search)
        }
    }

    func units(modelId: String) async throws -> [CatalogUnit] {
        guard isOnline else { return offlineUnits(modelId: modelId) }
        do {
            return try await api.get("/catalog/\(modelId)/units")
        } catch let e as AppError where e.isNetwork {
            return offlineUnits(modelId: modelId)
        }
    }

    // MARK: - offline (SwiftData cache → pure builder)

    private func offlineEntries(categoryId: String?, search: String?) -> [CatalogEntry] {
        CatalogOffline.entries(devices: cachedDevices(), products: cachedProducts(),
                               categoryId: categoryId, search: search)
    }

    private func offlineUnits(modelId: String) -> [CatalogUnit] {
        CatalogOffline.units(devices: cachedDevices(), modelId: modelId)
    }

    private func cachedDevices() -> [CatalogCachedDevice] {
        let rows = (try? context.fetch(FetchDescriptor<DeviceEntity>())) ?? []
        return rows.map { d in
            let specs = Self.specs(d.specsJSON)
            return CatalogCachedDevice(
                id: d.id, imei: d.imei, serialNumber: d.serialNumber, statusCode: d.statusCode,
                kindCode: d.kindCode, targetPrice: d.targetPrice,
                storage: specs["storage"], color: specs["color"], gradeCode: d.gradeCode,
                modelId: d.modelId, brand: d.modelBrand, name: d.modelName,
                categoryId: d.modelCategoryId, imageUrl: d.modelImageUrl)
        }
    }

    private func cachedProducts() -> [CatalogCachedProduct] {
        let rows = (try? context.fetch(FetchDescriptor<ProductEntity>())) ?? []
        return rows.map {
            CatalogCachedProduct(modelId: $0.modelId, brand: $0.brand, name: $0.name,
                                 salePrice: $0.salePrice, quantity: $0.quantity,
                                 categoryId: $0.categoryId, imageUrl: $0.imageUrl)
        }
    }

    /// Pull the string specs (storage, color) out of a cached specs JSON blob.
    private static func specs(_ json: String) -> [String: String] {
        guard let data = json.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return [:] }
        var out: [String: String] = [:]
        for (k, v) in obj {
            if let s = v as? String { out[k] = s }
            else if let n = v as? NSNumber { out[k] = n.stringValue }
        }
        return out
    }
}
