import Foundation
import Observation

/// The seller on a buy: an existing customer (`id` set) or an inline new one
/// (`id` nil, `name` set). Name + phone ONLY — no passport / ID, by design.
struct PurchaseSeller: Equatable {
    var id: String?
    var name: String = ""
    var phone: String?

    var trimmedName: String { name.trimmingCharacters(in: .whitespacesAndNewlines) }
    var isSet: Bool { id != nil || !trimmedName.isEmpty }
}

/// The "Buy a phone" draft (ADR 0039): seller, the chosen model + its specs, the
/// unit identifier (IMEI or serial, by the model's kind), the price paid and the
/// account the money leaves. Online only. All validation lives here so the sheet
/// blocks before the server does.
@MainActor
@Observable
final class BuyPhoneDraft {
    var seller = PurchaseSeller()
    var modelId: String?
    var specs: [String: String] = [:]
    var imei = ""
    var imei2 = ""
    var dualSim = false
    var serial = ""
    var pricePaid = ""
    /// The account the money leaves (CASH default).
    var accountCode = PaymentAccounts.cash

    func reset() {
        seller = PurchaseSeller()
        modelId = nil; specs = [:]; imei = ""; imei2 = ""; dualSim = false
        serial = ""; pricePaid = ""; accountCode = PaymentAccounts.cash
    }

    // MARK: - Derived

    var priceDecimal: Decimal {
        Decimal(string: pricePaid.trimmingCharacters(in: .whitespaces)) ?? .zero
    }

    /// Whether every required field for `model` is set so Buy can fire.
    func isValid(_ model: PurchaseModel?) -> Bool {
        guard let model, seller.isSet, priceDecimal > 0 else { return false }
        guard identifierValid(model) else { return false }
        for attr in model.attributes where attr.required {
            if (specs[attr.key]?.trimmingCharacters(in: .whitespaces) ?? "").isEmpty { return false }
        }
        return true
    }

    private func identifierValid(_ model: PurchaseModel) -> Bool {
        if model.isSerial { return UnitCode.isValidSerial(UnitCode.normalizeSerial(serial)) }
        if !Self.isImei(imei) { return false }
        if dualSim { let s = imei2.trimmingCharacters(in: .whitespaces); return Self.isImei(s) && s != imei }
        return true
    }

    /// An IMEI is exactly 15 ASCII digits (the server rejects anything else).
    /// Slice-local — a trivial rule, not a dependency on another slice.
    static func isImei(_ raw: String) -> Bool {
        let s = raw.trimmingCharacters(in: .whitespaces)
        return s.count == 15 && s.allSatisfy { $0.isASCII && $0.isNumber }
    }

    /// Trimmed string, or nil when empty — keeps optional keys out of the body.
    private func nonEmpty(_ value: String?) -> String? {
        let t = (value ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        return t.isEmpty ? nil : t
    }

    /// The `POST /customer-purchases` body for `model`; nil when invalid.
    func payload(_ model: PurchaseModel?) -> BuyPhonePayload? {
        guard let model, isValid(model) else { return nil }
        let kept = specs.filter { !$0.value.trimmingCharacters(in: .whitespaces).isEmpty }
        let inline: PurchaseSellerPost? = seller.id == nil
            ? PurchaseSellerPost(name: seller.trimmedName, phone: nonEmpty(seller.phone)) : nil
        return BuyPhonePayload(
            customerId: seller.id,
            customer: inline,
            modelId: model.id,
            imei: model.isSerial ? nil : nonEmpty(imei),
            imei2: model.isSerial ? nil : (dualSim ? nonEmpty(imei2) : nil),
            serialNumber: model.isSerial ? UnitCode.normalizeSerial(serial) : nil,
            specs: kept.isEmpty ? nil : kept,
            pricePaid: NSDecimalNumber(decimal: priceDecimal).doubleValue,
            accountCode: accountCode)
    }
}
