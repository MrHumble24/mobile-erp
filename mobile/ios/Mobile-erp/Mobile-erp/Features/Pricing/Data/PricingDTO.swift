import Foundation

/// A price level for the pickers (`GET /pricing/levels`, any signed-in user).
struct PriceLevelDTO: Decodable, Identifiable {
    let code: String
    let label: String
    var id: String { code }
}

/// One stored product price row (`GET /pricing/products/:modelId`). `storage`
/// empty or nil means "any storage"; `price` is a 2-dp Decimal string.
struct ProductPriceRow: Decodable {
    let storage: String?
    let levelCode: String
    let price: String?

    /// Normalised storage key: "" for any storage.
    var storageKey: String { (storage ?? "").trimmingCharacters(in: .whitespaces) }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        storage = try c.decodeIfPresent(String.self, forKey: .storage)
        levelCode = try c.decode(String.self, forKey: .levelCode)
        if let s = try? c.decodeIfPresent(String.self, forKey: .price) { price = s }
        else if let d = try? c.decodeIfPresent(Double.self, forKey: .price) {
            price = NSDecimalNumber(value: d).stringValue
        } else { price = nil }
    }

    enum CodingKeys: String, CodingKey { case storage, levelCode, price }
}

/// A product's full price picture (`GET /pricing/products/:modelId`).
struct ProductPricesView: Decodable {
    let modelId: String
    let kindCode: String
    let prices: [ProductPriceRow]
}

/// One unit own-price row (`GET /pricing/units/:deviceId`).
struct UnitPriceRow: Decodable {
    let levelCode: String
    let price: String?

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        levelCode = try c.decode(String.self, forKey: .levelCode)
        if let s = try? c.decodeIfPresent(String.self, forKey: .price) { price = s }
        else if let d = try? c.decodeIfPresent(Double.self, forKey: .price) {
            price = NSDecimalNumber(value: d).stringValue
        } else { price = nil }
    }

    enum CodingKeys: String, CodingKey { case levelCode, price }
}

/// A unit's own prices (`GET /pricing/units/:deviceId`). RETAIL = targetPrice.
struct UnitPricesView: Decodable {
    let deviceId: String
    let prices: [UnitPriceRow]
}
