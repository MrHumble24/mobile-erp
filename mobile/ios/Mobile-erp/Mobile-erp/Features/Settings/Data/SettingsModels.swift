import Foundation

/// Store settings as returned by `GET /settings` (open to any authenticated
/// user). Numeric columns arrive as JSON numbers; `minMarginPercent` is a
/// Prisma Decimal serialized as a string, so it is kept as a string and shown
/// via `Font.mono`. Mirrors the web `StoreSettings`.
struct StoreSettings: Decodable {
    let storeName: String?
    let storeAddress: String?
    let storePhone: String?
    let receiptFooter: String?
    let telegramChatId: String?
    let closingTime: String
    let defaultWarrantyDays: Int
    let minMarginPercent: String
    let lowStockThreshold: Int
    let defaultNasiyaDueDays: Int
    let overdueReminderDays: Int
    let updatedAt: String
    // Discounts (ADR 0034). Presets are canonical decimal strings.
    let discountsEnabled: Bool
    let discountPercentAllowed: Bool
    let discountAmountAllowed: Bool
    let discountPresetsPercent: [String]
    let discountPresetsAmount: [String]
    let maxDiscountPercent: String
    // Customer credit (ADR 0035) + cashier shifts (ADR 0036). Both off by default.
    let customerCreditEnabled: Bool
    /// Default credit ceiling per customer; nil = no cap.
    let defaultCreditLimit: String?
    let shiftsEnabled: Bool
    /// Repairs (ADR 0040), off by default. Hides the whole repairs feature.
    let repairsEnabled: Bool

    enum CodingKeys: String, CodingKey {
        case storeName, storeAddress, storePhone, receiptFooter, telegramChatId
        case closingTime, defaultWarrantyDays, minMarginPercent, lowStockThreshold
        case defaultNasiyaDueDays, overdueReminderDays, updatedAt
        case discountsEnabled, discountPercentAllowed, discountAmountAllowed
        case discountPresetsPercent, discountPresetsAmount, maxDiscountPercent
        case customerCreditEnabled, defaultCreditLimit, shiftsEnabled, repairsEnabled
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        storeName = try c.decodeIfPresent(String.self, forKey: .storeName)
        storeAddress = try c.decodeIfPresent(String.self, forKey: .storeAddress)
        storePhone = try c.decodeIfPresent(String.self, forKey: .storePhone)
        receiptFooter = try c.decodeIfPresent(String.self, forKey: .receiptFooter)
        telegramChatId = try c.decodeIfPresent(String.self, forKey: .telegramChatId)
        closingTime = (try? c.decode(String.self, forKey: .closingTime)) ?? "20:00"
        defaultWarrantyDays = Self.int(c, .defaultWarrantyDays)
        minMarginPercent = Self.numberString(c, .minMarginPercent)
        lowStockThreshold = Self.int(c, .lowStockThreshold)
        defaultNasiyaDueDays = Self.int(c, .defaultNasiyaDueDays)
        overdueReminderDays = Self.int(c, .overdueReminderDays)
        updatedAt = (try? c.decode(String.self, forKey: .updatedAt)) ?? ""
        discountsEnabled = (try? c.decode(Bool.self, forKey: .discountsEnabled)) ?? false
        discountPercentAllowed = (try? c.decode(Bool.self, forKey: .discountPercentAllowed)) ?? true
        discountAmountAllowed = (try? c.decode(Bool.self, forKey: .discountAmountAllowed)) ?? true
        discountPresetsPercent = Self.numberArray(c, .discountPresetsPercent)
        discountPresetsAmount = Self.numberArray(c, .discountPresetsAmount)
        maxDiscountPercent = Self.numberString(c, .maxDiscountPercent)
        customerCreditEnabled = (try? c.decode(Bool.self, forKey: .customerCreditEnabled)) ?? false
        defaultCreditLimit = Self.optNumberString(c, .defaultCreditLimit)
        shiftsEnabled = (try? c.decode(Bool.self, forKey: .shiftsEnabled)) ?? false
        repairsEnabled = (try? c.decode(Bool.self, forKey: .repairsEnabled)) ?? false
    }

    /// A nullable money field → canonical string, or nil when null / missing.
    private static func optNumberString(_ c: KeyedDecodingContainer<CodingKeys>, _ k: CodingKeys) -> String? {
        if let s = try? c.decode(String.self, forKey: k) { return s }
        if let d = try? c.decode(Double.self, forKey: k) {
            return d == d.rounded() ? String(Int(d)) : String(d)
        }
        return nil
    }

    /// A JSON array of numbers (or strings) → canonical decimal strings.
    private static func numberArray(_ c: KeyedDecodingContainer<CodingKeys>, _ k: CodingKeys) -> [String] {
        if let arr = try? c.decode([Double].self, forKey: k) {
            return arr.map { $0 == $0.rounded() ? String(Int($0)) : NSDecimalNumber(value: $0).stringValue }
        }
        if let arr = try? c.decode([String].self, forKey: k) { return arr }
        return []
    }

    private static func int(_ c: KeyedDecodingContainer<CodingKeys>, _ k: CodingKeys) -> Int {
        if let n = try? c.decode(Int.self, forKey: k) { return n }
        if let s = try? c.decode(String.self, forKey: k), let n = Int(s) { return n }
        return 0
    }

    /// A field that may arrive as a JSON number or a string → canonical string.
    private static func numberString(_ c: KeyedDecodingContainer<CodingKeys>, _ k: CodingKeys) -> String {
        if let s = try? c.decode(String.self, forKey: k) { return s }
        if let d = try? c.decode(Double.self, forKey: k) {
            return d == d.rounded() ? String(Int(d)) : String(d)
        }
        return "0"
    }
}

/// `PUT /settings` body (`settings.manage`). Matches the server
/// `UpdateSettingsDto` whitelist exactly — nothing else may be sent.
struct SettingsValues: Equatable {
    var storeName = ""
    var storeAddress = ""
    var storePhone = ""
    var receiptFooter = ""
    var telegramChatId = ""
    var closingTime = "20:00"
    var defaultWarrantyDays = ""
    var minMarginPercent = ""
    var lowStockThreshold = ""
    var defaultNasiyaDueDays = ""
    var overdueReminderDays = ""
    // Discounts (ADR 0034).
    var discountsEnabled = false
    var discountPercentAllowed = true
    var discountAmountAllowed = true
    var discountPresetsPercent = ""
    var discountPresetsAmount = ""
    var maxDiscountPercent = ""
    // Customer credit (ADR 0035) + shifts (ADR 0036) + repairs (ADR 0040).
    var customerCreditEnabled = false
    var defaultCreditLimit = ""
    var shiftsEnabled = false
    var repairsEnabled = false

    init() {}

    init(_ s: StoreSettings) {
        storeName = s.storeName ?? ""
        storeAddress = s.storeAddress ?? ""
        storePhone = s.storePhone ?? ""
        receiptFooter = s.receiptFooter ?? ""
        telegramChatId = s.telegramChatId ?? ""
        closingTime = s.closingTime
        defaultWarrantyDays = String(s.defaultWarrantyDays)
        minMarginPercent = s.minMarginPercent
        lowStockThreshold = String(s.lowStockThreshold)
        defaultNasiyaDueDays = String(s.defaultNasiyaDueDays)
        overdueReminderDays = String(s.overdueReminderDays)
        discountsEnabled = s.discountsEnabled
        discountPercentAllowed = s.discountPercentAllowed
        discountAmountAllowed = s.discountAmountAllowed
        discountPresetsPercent = s.discountPresetsPercent.joined(separator: ", ")
        discountPresetsAmount = s.discountPresetsAmount.joined(separator: ", ")
        maxDiscountPercent = s.maxDiscountPercent
        customerCreditEnabled = s.customerCreditEnabled
        defaultCreditLimit = s.defaultCreditLimit ?? ""
        shiftsEnabled = s.shiftsEnabled
        repairsEnabled = s.repairsEnabled
    }

    /// Parse a comma/space-separated preset field into up to five numbers.
    private func presets(_ raw: String) -> [Double] {
        raw.split(whereSeparator: { $0 == "," || $0 == " " })
            .compactMap { Double($0.trimmingCharacters(in: .whitespaces)) }
            .prefix(5)
            .map { $0 }
    }

    /// Clean JSON body: text fields become explicit `null` when blank (the web
    /// clears them this way); numeric fields are sent as numbers.
    func body() -> [String: Any] {
        func text(_ v: String) -> Any { v.isEmpty ? NSNull() : v }
        return [
            "storeName": text(storeName),
            "storeAddress": text(storeAddress),
            "storePhone": text(storePhone),
            "receiptFooter": text(receiptFooter),
            "telegramChatId": text(telegramChatId),
            "closingTime": closingTime,
            "defaultWarrantyDays": Int(defaultWarrantyDays) ?? 0,
            "minMarginPercent": Double(minMarginPercent) ?? 0,
            "lowStockThreshold": Int(lowStockThreshold) ?? 0,
            "defaultNasiyaDueDays": Int(defaultNasiyaDueDays) ?? 0,
            "overdueReminderDays": Int(overdueReminderDays) ?? 0,
            "discountsEnabled": discountsEnabled,
            "discountPercentAllowed": discountPercentAllowed,
            "discountAmountAllowed": discountAmountAllowed,
            "discountPresetsPercent": presets(discountPresetsPercent),
            "discountPresetsAmount": presets(discountPresetsAmount),
            "maxDiscountPercent": Double(maxDiscountPercent) ?? 0,
            "customerCreditEnabled": customerCreditEnabled,
            "defaultCreditLimit": defaultCreditLimit.isEmpty ? NSNull() : (Double(defaultCreditLimit) ?? NSNull()),
            "shiftsEnabled": shiftsEnabled,
            "repairsEnabled": repairsEnabled,
        ]
    }
}
