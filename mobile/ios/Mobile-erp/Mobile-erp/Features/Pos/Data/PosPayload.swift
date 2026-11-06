import Foundation

/// Inline new customer (mutually exclusive with an existing `customerId`).
nonisolated struct InlineCustomerPayload: Encodable {
    let name: String
    let phone: String?
}

/// A per-line discount sent with a sale (ADR 0034). `value` is a percent or a
/// money amount per `mode`; the server derives the amount and checks the price.
nonisolated struct SaleDiscountPost: Encodable {
    let mode: String
    let value: Double
}

/// The `CreateSaleDto` body. Swift's synthesized `Encodable` omits nil optionals
/// (`encodeIfPresent`), so no stray keys reach the server's `forbidNonWhitelisted`.
/// A unit sale sends `imei`/`serialNumber` + `expectedVersion`; a quantity sale
/// sends `modelId` + `quantity` and `salePrice` is the line total (ADR 0030).
nonisolated struct SaleCreatePayload: Encodable {
    let imei: String?
    let serialNumber: String?
    /// Quantity sale: the product and pieces; mutually exclusive with imei/serial.
    let modelId: String?
    let quantity: Int?
    let salePrice: Double
    let clientMutationId: String
    /// Unit sale only; nil (omitted) for a quantity sale (no device lock).
    let expectedVersion: Int?
    let customerId: String?
    let customer: InlineCustomerPayload?
    let warrantyDays: Int?
    let notes: String?
    /// How the sale was tendered; nil (omitted) means a single CASH payment of
    /// the whole price. Carried verbatim into the offline outbox.
    let payments: [SalePaymentPost]?
    /// Price level for the line (ADR 0034); omitted follows the customer's level.
    let priceLevelCode: String?
    /// The line's discount; omitted when none or when the price is overridden.
    let discount: SaleDiscountPost?
    /// The till's list price for the line — trusted only on the offline replay
    /// path; the server ignores it online.
    let listPrice: Double?
    /// Phones taken in part payment on this line (ADR 0039); omitted when none.
    /// Online only — never set on an offline (queued) sale.
    let tradeIns: [SaleTradeInPost]?
    /// Loyalty bonus points redeemed on this line (ADR 0043); omitted when none.
    let bonusRedeem: Double?
}

/// Pure builder — one payload shape for both the online POST and the offline
/// outbox row, kept free of SwiftData/HTTP so it stays unit-testable. Pass either
/// a unit (`imei`/`serialNumber` + `expectedVersion`) or a quantity product
/// (`modelId` + `quantity`), never both. A new inline customer and an existing
/// `customerId` are mutually exclusive.
func buildSalePayload(
    imei: String? = nil,
    serialNumber: String? = nil,
    modelId: String? = nil,
    quantity: Int? = nil,
    salePrice: Double,
    clientMutationId: String,
    expectedVersion: Int? = nil,
    customerId: String?,
    customerName: String?,
    customerPhone: String?,
    warrantyDays: Int?,
    notes: String?,
    payments: [SalePaymentPost]? = nil,
    priceLevelCode: String? = nil,
    discount: SaleDiscountPost? = nil,
    listPrice: Double? = nil,
    tradeIns: [SaleTradeInPost]? = nil,
    bonusRedeem: Double? = nil
) -> SaleCreatePayload {
    let existing = (customerId ?? "").trimmingCharacters(in: .whitespaces)
    let name = (customerName ?? "").trimmingCharacters(in: .whitespaces)
    let inline: InlineCustomerPayload? =
        existing.isEmpty && !name.isEmpty
            ? InlineCustomerPayload(name: name, phone: nonEmpty(customerPhone))
            : nil
    let redeem = (bonusRedeem != nil && bonusRedeem! > 0) ? bonusRedeem : nil
    return SaleCreatePayload(
        imei: nonEmpty(imei),
        serialNumber: nonEmpty(serialNumber),
        modelId: nonEmpty(modelId),
        quantity: quantity,
        salePrice: salePrice,
        clientMutationId: clientMutationId,
        expectedVersion: expectedVersion,
        customerId: existing.isEmpty ? nil : existing,
        customer: inline,
        warrantyDays: warrantyDays,
        notes: nonEmpty(notes),
        payments: (payments?.isEmpty ?? true) ? nil : payments,
        priceLevelCode: nonEmpty(priceLevelCode),
        discount: discount,
        listPrice: listPrice,
        tradeIns: (tradeIns?.isEmpty ?? true) ? nil : tradeIns,
        bonusRedeem: redeem
    )
}

/// Trimmed string, or nil when empty — keeps optional keys out of the payload.
func nonEmpty(_ value: String?) -> String? {
    let trimmed = (value ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
    return trimmed.isEmpty ? nil : trimmed
}

/// Parse the server's money string exactly (never via Double literal).
func moneyToDouble(_ value: String) -> Double {
    let trimmed = value.trimmingCharacters(in: .whitespaces)
    return NSDecimalNumber(decimal: Decimal(string: trimmed) ?? .zero).doubleValue
}
