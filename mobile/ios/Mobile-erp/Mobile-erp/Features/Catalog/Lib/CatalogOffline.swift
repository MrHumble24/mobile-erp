import Foundation

/// A cached in-stock device, flattened from `DeviceEntity` (ADR 0031). Kept free
/// of SwiftData so the offline catalog build is unit-testable.
struct CatalogCachedDevice {
    let id: String
    let imei: String?
    let serialNumber: String?
    let statusCode: String
    let kindCode: String?
    let targetPrice: String?
    let storage: String?
    let color: String?
    let gradeCode: String?
    let modelId: String
    let brand: String
    let name: String
    let categoryId: String?
    let imageUrl: String?
}

/// A cached quantity product, flattened from `ProductEntity`.
struct CatalogCachedProduct {
    let modelId: String
    let brand: String
    let name: String
    let salePrice: String?
    let quantity: Int
    let categoryId: String?
    let imageUrl: String?
}

/// Pure offline-catalog transformation (ADR 0031), mirroring the web
/// `build-catalog.ts`: one card per unit model with ≥ 1 IN_STOCK unit (count +
/// min/max target price) and one per quantity product, with the same
/// category/search filters. No SwiftData, no API — `CatalogRepository` feeds it
/// the cached rows.
enum CatalogOffline {
    static let inStock = "IN_STOCK"

    static func entries(devices: [CatalogCachedDevice], products: [CatalogCachedProduct],
                        categoryId: String?, search: String?) -> [CatalogEntry] {
        let q = (search ?? "").trimmingCharacters(in: .whitespaces).lowercased()
        let rows = unitEntries(devices) + products.map { productEntry($0) }
        return rows
            .filter { row in
                if let categoryId, row.entry.categoryId != categoryId { return false }
                return matches(row, q)
            }
            .map(\.entry)
            .sorted { $0.label.localizedCaseInsensitiveCompare($1.label) == .orderedAscending }
    }

    /// The IN_STOCK units of one product, for the picker offline.
    static func units(devices: [CatalogCachedDevice], modelId: String) -> [CatalogUnit] {
        devices
            .filter { $0.modelId == modelId && $0.statusCode == inStock }
            .map { d in
                var specs: [String: String] = [:]
                if let s = d.storage, !s.isEmpty { specs["storage"] = s }
                if let c = d.color, !c.isEmpty { specs["color"] = c }
                return CatalogUnit(id: d.id, code: d.imei ?? d.serialNumber ?? "",
                                   specs: specs, gradeCode: d.gradeCode, targetPrice: d.targetPrice)
            }
    }

    // MARK: - internals

    private struct Row { let entry: CatalogEntry; let storage: String }

    private static func matches(_ row: Row, _ q: String) -> Bool {
        guard !q.isEmpty else { return true }
        return "\(row.entry.brand) \(row.entry.name) \(row.storage)".lowercased().contains(q)
    }

    private static func unitEntries(_ devices: [CatalogCachedDevice]) -> [Row] {
        var byModel: [String: [CatalogCachedDevice]] = [:]
        for d in devices where d.statusCode == inStock { byModel[d.modelId, default: []].append(d) }
        return byModel.map { modelId, units in
            let first = units[0]
            let (min, max) = minMax(units.map(\.targetPrice))
            return Row(
                entry: CatalogEntry(
                    modelId: modelId, brand: first.brand, name: first.name,
                    kindCode: first.kindCode ?? "IMEI", categoryId: first.categoryId,
                    categoryName: nil, imageUrl: first.imageUrl, inStock: units.count,
                    minTargetPrice: min, maxTargetPrice: max, salePrice: nil),
                storage: units.compactMap(\.storage).joined(separator: " "))
        }
    }

    private static func productEntry(_ p: CatalogCachedProduct) -> Row {
        Row(entry: CatalogEntry(
            modelId: p.modelId, brand: p.brand, name: p.name, kindCode: "QUANTITY",
            categoryId: p.categoryId, categoryName: nil, imageUrl: p.imageUrl,
            inStock: p.quantity, minTargetPrice: nil, maxTargetPrice: nil, salePrice: p.salePrice),
            storage: "")
    }

    private static func minMax(_ prices: [String?]) -> (String?, String?) {
        let nums = prices.compactMap { $0 }.compactMap { Decimal(string: $0) }
        guard let lo = nums.min(), let hi = nums.max() else { return (nil, nil) }
        return (decimalString(lo), decimalString(hi))
    }

    private static func decimalString(_ d: Decimal) -> String {
        NSDecimalNumber(decimal: d).stringValue
    }
}
