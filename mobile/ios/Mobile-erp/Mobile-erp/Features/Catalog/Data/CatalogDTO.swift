import Foundation

/// One product card in the till grid (ADR 0031, `GET /catalog`). A unit product
/// (IMEI/SERIAL) carries a target-price range (`salePrice` nil); a quantity
/// product carries `salePrice` and `inStock` may be ≤ 0 (price range nil). Money
/// fields are 2-dp strings.
struct CatalogEntry: Decodable, Identifiable {
    let modelId: String
    let brand: String
    let name: String
    let kindCode: String
    let categoryId: String?
    let categoryName: String?
    let imageUrl: String?
    let inStock: Int
    let minTargetPrice: String?
    let maxTargetPrice: String?
    let salePrice: String?

    var id: String { modelId }
    var label: String { "\(brand) \(name)".trimmingCharacters(in: .whitespaces) }
    var isQuantity: Bool { kindCode == "QUANTITY" }
    /// A card with nothing (or a negative balance) in stock — shown in danger.
    var lowStock: Bool { inStock <= 0 }
}

/// One in-stock unit of a unit product (`GET /catalog/:modelId/units`), picked
/// after tapping a card. `code` is the IMEI or serial number.
struct CatalogUnit: Decodable, Identifiable {
    let id: String
    let code: String
    let specs: [String: String]
    let gradeCode: String?
    let targetPrice: String?

    var storage: String? { specs["storage"].flatMap { $0.isEmpty ? nil : $0 } }
    var color: String? { specs["color"].flatMap { $0.isEmpty ? nil : $0 } }

    enum CodingKeys: String, CodingKey { case id, code, specs, gradeCode, targetPrice }

    init(id: String, code: String, specs: [String: String],
         gradeCode: String?, targetPrice: String?) {
        self.id = id; self.code = code; self.specs = specs
        self.gradeCode = gradeCode; self.targetPrice = targetPrice
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        code = try c.decodeIfPresent(String.self, forKey: .code) ?? ""
        gradeCode = try c.decodeIfPresent(String.self, forKey: .gradeCode)
        targetPrice = try c.decodeIfPresent(String.self, forKey: .targetPrice)
        // Specs is open-ended JSON (ADR 0013): keep only the string-ish values the
        // picker shows (storage, color), stringifying numbers.
        specs = (try? c.decode([String: JSONScalar].self, forKey: .specs))?
            .compactMapValues { $0.stringValue } ?? [:]
    }
}

/// Decodes a JSON scalar (string / number / bool) as its string form; anything
/// else (object, array, null) becomes nil. Keeps `specs` lenient without a
/// third-party AnyCodable.
private enum JSONScalar: Decodable {
    case value(String)
    case other

    var stringValue: String? { if case let .value(s) = self { return s } else { return nil } }

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let s = try? c.decode(String.self) { self = .value(s) }
        else if let d = try? c.decode(Double.self) { self = .value(NSNumber(value: d).stringValue) }
        else if let b = try? c.decode(Bool.self) { self = .value(String(b)) }
        else { self = .other }
    }
}
