import Foundation

/// A device as shown in the offline list, built from the cached `DeviceEntity`
/// (hydrated by `/sync/changes`). Cost fields are never in the cache. `specs`
/// is decoded from the stored JSON blob.
struct DeviceListItem: Identifiable {
    let id: String
    let imei: String
    let statusCode: String
    let modelId: String
    let modelLabel: String
    let specs: [String: String]
    let targetPrice: String?

    var storage: String? { specs["storage"] }

    init(_ row: DeviceEntity) {
        id = row.id
        imei = row.imei
        statusCode = row.statusCode
        modelId = row.modelId
        modelLabel = "\(row.modelBrand) \(row.modelName)".trimmingCharacters(in: .whitespaces)
        targetPrice = row.targetPrice
        if let data = row.specsJSON.data(using: .utf8),
           let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            specs = DeviceSpecs.stringify(obj)
        } else {
            specs = [:]
        }
    }

    /// Test seam: build directly without a SwiftData row.
    init(id: String, imei: String, statusCode: String, modelId: String,
         modelLabel: String, specs: [String: String], targetPrice: String?) {
        self.id = id; self.imei = imei; self.statusCode = statusCode
        self.modelId = modelId; self.modelLabel = modelLabel
        self.specs = specs; self.targetPrice = targetPrice
    }
}

/// Client-side inventory filters applied over the cached list. Search matches
/// the IMEI (last digits) or the model label; model / storage / status are
/// exact. Pure logic so the list, the metrics bar and the self-check share it.
struct DeviceFilter: Equatable {
    var search = ""
    var modelId: String?
    var storage: String?
    var statusCode: String?

    var isEmpty: Bool {
        search.isEmpty && modelId == nil && storage == nil && statusCode == nil
    }

    var activeCount: Int {
        [search.isEmpty ? nil : 1, modelId.map { _ in 1 },
         storage.map { _ in 1 }, statusCode.map { _ in 1 }].compactMap { $0 }.count
    }

    func matches(_ d: DeviceListItem) -> Bool {
        let q = search.trimmingCharacters(in: .whitespaces).lowercased()
        if !q.isEmpty,
           !d.imei.lowercased().contains(q),
           !d.modelLabel.lowercased().contains(q) { return false }
        if let modelId, d.modelId != modelId { return false }
        if let storage, d.storage != storage { return false }
        if let statusCode, d.statusCode != statusCode { return false }
        return true
    }
}

/// Status counts over the full cached list, for the metrics bar.
struct DeviceMetrics {
    var total = 0
    var inStock = 0
    var defective = 0
    var consigned = 0

    init(_ items: [DeviceListItem]) {
        total = items.count
        for d in items {
            switch d.statusCode {
            case "IN_STOCK": inStock += 1
            case "DEFECTIVE": defective += 1
            case "CONSIGNED": consigned += 1
            default: break
            }
        }
    }
}

#if DEBUG
/// Assert-based self-check for the pure list logic (filter matching, metrics,
/// transition policy). The slice-local stand-in for a test target; run once
/// from the inventory view in DEBUG.
enum InventorySelfCheck {
    static let ran: Bool = {
        let a = DeviceListItem(id: "1", imei: "358001234567890", statusCode: "IN_STOCK",
                               modelId: "m1", modelLabel: "Apple iPhone 13",
                               specs: ["storage": "128GB"], targetPrice: "500")
        let b = DeviceListItem(id: "2", imei: "358009999999999", statusCode: "DEFECTIVE",
                               modelId: "m2", modelLabel: "Samsung S21",
                               specs: ["storage": "256GB"], targetPrice: nil)

        // Search by last IMEI digits and by model label.
        assert(DeviceFilter(search: "7890").matches(a))
        assert(!DeviceFilter(search: "7890").matches(b))
        assert(DeviceFilter(search: "iphone").matches(a))
        // Exact facet filters.
        assert(DeviceFilter(storage: "128GB").matches(a))
        assert(!DeviceFilter(statusCode: "SOLD").matches(a))

        let m = DeviceMetrics([a, b])
        assert(m.total == 2 && m.inStock == 1 && m.defective == 1 && m.consigned == 0)

        // CONSIGNED/SOLD are never manual targets; warranty return is.
        assert(DeviceStatusMeta.transitions(for: "IN_STOCK") == ["DEFECTIVE"])
        assert(DeviceStatusMeta.transitions(for: "CONSIGNED").isEmpty)
        assert(DeviceStatusMeta.transitions(for: "SOLD").contains("DEFECTIVE"))
        return true
    }()
}
#endif
