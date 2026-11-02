import Foundation

/// Parses the `/sync/changes` payload. Kept here so the pull service stays
/// about paging, not field-plucking. The feed's `specs` and `latestSale` are
/// open-ended JSON, so they are carried as raw JSON strings into the cache.
struct ChangesPage {
    let nextSince: String?
    let devices: [DeviceRow]
    let partners: [PartnerRow]

    init(json: [String: Any]) {
        nextSince = json["nextSince"] as? String
        devices = (json["devices"] as? [[String: Any]] ?? []).map(DeviceRow.init)
        partners = (json["partners"] as? [[String: Any]] ?? []).map(PartnerRow.init)
    }
}

struct DeviceRow {
    let id, imei, statusCode, updatedAt: String
    let version: Int
    let targetPrice: String?
    let specsJSON: String
    let modelId, modelBrand, modelName: String
    let latestSaleJSON: String?
    let gradeCode, inspectionNotes: String?

    init(_ d: [String: Any]) {
        id = d["id"] as? String ?? ""
        imei = d["imei"] as? String ?? ""
        statusCode = d["statusCode"] as? String ?? ""
        version = (d["version"] as? NSNumber)?.intValue ?? 0
        targetPrice = Self.string(d["targetPrice"])
        specsJSON = Self.encode(d["specs"]) ?? "{}"
        let model = d["model"] as? [String: Any] ?? [:]
        modelId = model["id"] as? String ?? ""
        modelBrand = model["brand"] as? String ?? ""
        modelName = model["name"] as? String ?? ""
        latestSaleJSON = d["latestSale"].flatMap { $0 is NSNull ? nil : Self.encode($0) }
        let inspection = d["latestInspection"] as? [String: Any]
        gradeCode = inspection?["gradeCode"] as? String
        inspectionNotes = inspection?["notes"] as? String
        updatedAt = d["updatedAt"] as? String ?? ""
    }

    private static func string(_ v: Any?) -> String? {
        if v == nil || v is NSNull { return nil }
        if let s = v as? String { return s }
        if let n = v as? NSNumber { return n.stringValue }
        return nil
    }

    private static func encode(_ v: Any?) -> String? {
        guard let v, !(v is NSNull),
              let data = try? JSONSerialization.data(withJSONObject: v) else { return nil }
        return String(decoding: data, as: UTF8.self)
    }
}

struct PartnerRow {
    let id, shopName, creditLimit, outstanding: String
    let phone: String?

    init(_ p: [String: Any]) {
        id = p["id"] as? String ?? ""
        shopName = p["shopName"] as? String ?? ""
        phone = p["phone"] as? String
        creditLimit = Self.money(p["creditLimit"])
        outstanding = Self.money(p["outstanding"])
    }

    private static func money(_ v: Any?) -> String {
        if let s = v as? String { return s }
        if let n = v as? NSNumber { return n.stringValue }
        return "0"
    }
}
