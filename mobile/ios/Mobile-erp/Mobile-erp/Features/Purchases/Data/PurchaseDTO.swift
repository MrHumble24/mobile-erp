import Foundation

/// Buying used phones from customers (Change 14, ADR 0039). Reads carry money as
/// a 2-dp Decimal **string**; `pricePaid` is redacted (OMITTED) without
/// `device.cost.view`, so it is optional. No passport / ID field exists anywhere
/// here, by design — the seller is a `Customer` (name + phone only).

// MARK: - Write payloads

/// Inline seller when no existing `customerId` is given — name + phone ONLY.
nonisolated struct PurchaseSellerPost: Encodable {
    let name: String
    let phone: String?
}

/// `POST /customer-purchases` body. Swift's synthesized `Encodable` omits nil
/// optionals, so no stray key reaches the server's `forbidNonWhitelisted`.
nonisolated struct BuyPhonePayload: Encodable {
    let customerId: String?
    let customer: PurchaseSellerPost?
    let modelId: String
    let imei: String?
    let imei2: String?
    let serialNumber: String?
    let specs: [String: String]?
    let pricePaid: Double
    let accountCode: String?
}

// MARK: - Read views

struct PurchasePartyRef: Decodable {
    let id: String
    let name: String
    let phone: String?
}

struct PurchaseUnitModel: Decodable {
    let id: String
    let brand: String
    let name: String
    let kindCode: String
    var label: String { "\(brand) \(name)".trimmingCharacters(in: .whitespaces) }
}

struct PurchaseUnitRef: Decodable {
    let deviceId: String
    let imei: String?
    let imei2: String?
    let serialNumber: String?
    let model: PurchaseUnitModel
    var code: String { UnitCode.display(imei: imei, serialNumber: serialNumber) }
}

/// One customer purchase (`GET /customer-purchases` + `/:id`). `pricePaid` is
/// nil when the server redacted it (no cost permission). `accountCode` is nil
/// for a trade-in (its value netted the sale, so no money moved).
struct CustomerPurchaseView: Decodable, Identifiable {
    let id: String
    let customer: PurchasePartyRef
    let unit: PurchaseUnitRef
    let pricePaid: String?
    let accountCode: String?
    let saleId: String?
    let soldBy: PurchasePartyRef
    let occurredAt: String

    /// A trade-in at the till (netted a sale) rather than a plain buy.
    var isTradeIn: Bool { saleId != nil }
}

struct CustomerPurchasePage: Decodable {
    let items: [CustomerPurchaseView]
    let total: Int
    let page: Int
    let pageSize: Int
}

// MARK: - Buy-sheet product catalog

/// One spec field defined on a device model (server `ProcAttributeDef`). Slice-
/// local copy (a slice must not import another slice's symbols).
struct PurchaseAttr: Decodable, Identifiable {
    let key: String
    let label: String
    /// `text` | `number` | `select`.
    let type: String
    let options: [String]
    let required: Bool
    var id: String { key }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        key = try c.decode(String.self, forKey: .key)
        label = try c.decode(String.self, forKey: .label)
        type = (try? c.decode(String.self, forKey: .type)) ?? "text"
        options = (try? c.decodeIfPresent([String].self, forKey: .options)) ?? []
        required = (try? c.decodeIfPresent(Bool.self, forKey: .required)) ?? false
    }
    enum CodingKeys: String, CodingKey { case key, label, type, options, required }
}

/// A catalog model for the buy sheet (`GET /device-models`). Only IMEI / SERIAL
/// models can be bought as units; QUANTITY products are filtered out.
struct PurchaseModel: Decodable, Identifiable {
    let id: String
    let brand: String
    let name: String
    let kindCode: String
    let attributes: [PurchaseAttr]

    var label: String { "\(brand) \(name)".trimmingCharacters(in: .whitespaces) }
    var isSerial: Bool { kindCode == "SERIAL" }
    var isQuantity: Bool { kindCode == "QUANTITY" }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        brand = try c.decode(String.self, forKey: .brand)
        name = try c.decode(String.self, forKey: .name)
        kindCode = (try? c.decodeIfPresent(String.self, forKey: .kindCode)) ?? "IMEI"
        attributes = (try? c.decodeIfPresent([PurchaseAttr].self, forKey: .attributes)) ?? []
    }
    enum CodingKeys: String, CodingKey { case id, brand, name, kindCode, attributes }
}
