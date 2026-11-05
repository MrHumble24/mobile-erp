import Foundation

/// The three price levels (ADR 0034). A lookup on the server, but the three
/// codes are stable, so the till knows them without a round-trip. Labels come
/// from the `pricing` i18n namespace.
enum PriceLevels {
    static let retail = "RETAIL"
    static let wholesale = "WHOLESALE"
    static let partner = "PARTNER"

    /// Display order, walk-in first (the default).
    static let all = [retail, wholesale, partner]
    static let defaultCode = retail

    /// i18n key for a level's short label (`pricing.levelRetail` …). An unknown
    /// code falls back to walk-in.
    static func labelKey(_ code: String) -> String {
        switch code {
        case wholesale: return "pricing.levelWholesale"
        case partner: return "pricing.levelPartner"
        default: return "pricing.levelRetail"
        }
    }

    /// i18n key for the customer-type picker label of a level.
    static func customerTypeKey(_ code: String) -> String { labelKey(code) }
}

/// Resolved list prices keyed by level code (ADR 0034), e.g.
/// `{ RETAIL: "1200.00", WHOLESALE: "1100.00" }`. A missing or null level means
/// no price is set for it. For a unit line this is the whole price; for a
/// quantity product it is the price **per piece**. Money stays a Decimal string.
struct PriceLevelPrices: Equatable {
    private let byLevel: [String: String]

    init(_ byLevel: [String: String] = [:]) { self.byLevel = byLevel }

    /// The price string for a level, or nil when none is set.
    func price(_ level: String) -> String? { byLevel[level] }

    /// The price for a level as an exact Decimal, or nil when none is set.
    func decimal(_ level: String) -> Decimal? {
        guard let s = byLevel[level] else { return nil }
        return Decimal(string: s)
    }

    var isEmpty: Bool { byLevel.isEmpty }

    /// From a `{ "RETAIL": "1200.00", "WHOLESALE": null }` JSON object (feed/API).
    static func from(json obj: [String: Any]?) -> PriceLevelPrices {
        guard let obj else { return PriceLevelPrices() }
        var out: [String: String] = [:]
        for (k, v) in obj {
            if let s = v as? String, !s.isEmpty { out[k] = s }
            else if let n = v as? NSNumber { out[k] = n.stringValue }
        }
        return PriceLevelPrices(out)
    }

    /// From a cached JSON string (the offline device/product rows store this).
    static func from(jsonString: String?) -> PriceLevelPrices {
        guard let s = jsonString, let data = s.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return PriceLevelPrices() }
        return from(json: obj)
    }

    /// Serialise back to a JSON string for the cache (nil when empty).
    func jsonString() -> String? {
        guard !byLevel.isEmpty,
              let data = try? JSONSerialization.data(withJSONObject: byLevel) else { return nil }
        return String(decoding: data, as: UTF8.self)
    }
}

extension PriceLevelPrices: Decodable {
    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        let dict = (try? c.decode([String: PriceScalar].self)) ?? [:]
        var out: [String: String] = [:]
        for (k, v) in dict { if let s = v.stringValue { out[k] = s } }
        self.init(out)
    }
}

/// A JSON price value: a Decimal string, a number (stringified) or null.
private enum PriceScalar: Decodable {
    case value(String)
    case none

    var stringValue: String? { if case let .value(s) = self, !s.isEmpty { return s } else { return nil } }

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self = .none }
        else if let s = try? c.decode(String.self) { self = .value(s) }
        else if let d = try? c.decode(Double.self) { self = .value(NSDecimalNumber(value: d).stringValue) }
        else { self = .none }
    }
}
