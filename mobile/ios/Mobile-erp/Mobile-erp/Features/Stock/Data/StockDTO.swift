import Foundation

/// Decode money either as a Decimal string (how Prisma serializes it) or a raw
/// number, keeping it exact. Returns nil when the key is absent (cost redacted).
enum StockMoney {
    static func decode<K: CodingKey>(_ c: KeyedDecodingContainer<K>, _ key: K) -> String? {
        if let s = try? c.decodeIfPresent(String.self, forKey: key) { return s }
        if let d = try? c.decodeIfPresent(Double.self, forKey: key) { return NSDecimalNumber(value: d).stringValue }
        return nil
    }
}

/// One quantity product with its current stock (`GET /stock`). `averageCost` and
/// `value` are null without `device.cost.view`; `quantity` may be negative.
struct StockLevel: Decodable, Identifiable {
    let modelId: String
    let brand: String
    let name: String
    let barcode: String?
    let modelCode: String?
    let categoryId: String?
    let salePrice: String?
    let quantity: Int
    let averageCost: String?
    let value: String?
    /// Resolved per-piece prices per level (ADR 0034); empty when none.
    let prices: PriceLevelPrices

    var id: String { modelId }
    var label: String { "\(brand) \(name)".trimmingCharacters(in: .whitespaces) }
    var isBelowZero: Bool { quantity < 0 }
    var isOutOfStock: Bool { quantity == 0 }

    enum CodingKeys: String, CodingKey {
        case modelId, brand, name, barcode, modelCode, categoryId, salePrice, quantity, averageCost, value, prices
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        modelId = try c.decode(String.self, forKey: .modelId)
        brand = try c.decode(String.self, forKey: .brand)
        name = try c.decode(String.self, forKey: .name)
        barcode = try c.decodeIfPresent(String.self, forKey: .barcode)
        modelCode = try c.decodeIfPresent(String.self, forKey: .modelCode)
        categoryId = try c.decodeIfPresent(String.self, forKey: .categoryId)
        salePrice = StockMoney.decode(c, .salePrice)
        quantity = try c.decode(Int.self, forKey: .quantity)
        averageCost = StockMoney.decode(c, .averageCost)
        value = StockMoney.decode(c, .value)
        prices = try c.decodeIfPresent(PriceLevelPrices.self, forKey: .prices) ?? PriceLevelPrices()
    }
}

/// One stock movement row (`GET /stock/:modelId/movements`), newest first.
/// `unitCostSnapshot` is null without the cost permission.
struct StockMovement: Decodable, Identifiable {
    let id: String
    let typeCode: String
    let typeLabel: String
    let quantity: Int
    let unitCostSnapshot: String?
    let note: String?
    let occurredAt: String
    let createdBy: Person?

    struct Person: Decodable { let id: String; let name: String }

    enum CodingKeys: String, CodingKey {
        case id, typeCode, typeLabel, quantity, unitCostSnapshot, note, occurredAt, createdBy
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        typeCode = try c.decode(String.self, forKey: .typeCode)
        typeLabel = try c.decodeIfPresent(String.self, forKey: .typeLabel) ?? typeCode
        quantity = try c.decode(Int.self, forKey: .quantity)
        unitCostSnapshot = StockMoney.decode(c, .unitCostSnapshot)
        note = try c.decodeIfPresent(String.self, forKey: .note)
        occurredAt = try c.decodeIfPresent(String.self, forKey: .occurredAt) ?? ""
        createdBy = try c.decodeIfPresent(Person.self, forKey: .createdBy)
    }
}

struct StockMovementsPage: Decodable {
    let items: [StockMovement]
    let total: Int
}
