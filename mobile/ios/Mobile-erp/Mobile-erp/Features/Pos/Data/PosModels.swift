import Foundation

/// A device resolved for checkout from the local SwiftData cache (offline-first
/// IMEI lookup). Normalized to the fields POS needs.
struct ScannedDevice: Identifiable {
    let id: String
    let imei: String
    let version: Int
    let statusCode: String
    let modelLabel: String
    let targetPrice: String?

    var inStock: Bool { statusCode == "IN_STOCK" }
}

/// Result of a checkout, rendered as the receipt. Built from local data so it is
/// identical online and offline — a queued sale has no server response to await.
struct CompletedSale: Identifiable {
    var id: String { receiptId }
    let receiptId: String
    let imei: String
    let modelLabel: String
    let salePrice: String
    let soldAt: Date
    let cashier: String
    let warrantyDays: Int?
    let warrantyEndsAt: Date?
    let customerName: String?
    /// True when queued offline (awaiting `/sync/push`) — shown as "pending sync".
    let pending: Bool
}

/// One device queued in the POS cart with its editable sale terms. Price and
/// warranty are strings (bound to text fields); `clientMutationId` is stable so
/// a retry or an offline enqueue is idempotent for this line.
struct PosCartLine: Identifiable {
    let id: String
    let device: ScannedDevice
    var price: String
    var warrantyDays: String
    var notes: String
    let clientMutationId: String
}

/// The cart's shared customer: an existing one (`id` set, from typeahead) or an
/// inline new one (`id` nil, `name` set). Mutually exclusive, enforced by
/// `buildSalePayload`.
struct PosCartCustomer: Equatable {
    var id: String?
    var name: String
    var phone: String?
}

/// A typeahead hit from `/customers/lookup` for attaching an existing customer.
struct PosCustomerHit: Decodable, Identifiable {
    let id: String
    let name: String
    let phone: String?
}

/// Inline new customer (mutually exclusive with an existing `customerId`).
struct InlineCustomerPayload: Encodable {
    let name: String
    let phone: String?
}

/// The `CreateSaleDto` body. Swift's synthesized `Encodable` omits nil optionals
/// (`encodeIfPresent`), so no stray keys reach the server's `forbidNonWhitelisted`.
/// `clientMutationId`/`expectedVersion` make an online retry idempotent; for an
/// offline enqueue the sync handler overrides them from the outbox entry.
struct SaleCreatePayload: Encodable {
    let imei: String
    let salePrice: Double
    let clientMutationId: String
    let expectedVersion: Int
    let customerId: String?
    let customer: InlineCustomerPayload?
    let warrantyDays: Int?
    let notes: String?
}

/// Pure builder — one payload shape for both the online POST and the offline
/// outbox row, kept free of SwiftData/HTTP so it stays unit-testable. A new
/// inline customer and an existing `customerId` are mutually exclusive.
func buildSalePayload(
    imei: String,
    salePrice: Double,
    clientMutationId: String,
    expectedVersion: Int,
    customerId: String?,
    customerName: String?,
    customerPhone: String?,
    warrantyDays: Int?,
    notes: String?
) -> SaleCreatePayload {
    let existing = (customerId ?? "").trimmingCharacters(in: .whitespaces)
    let name = (customerName ?? "").trimmingCharacters(in: .whitespaces)
    let inline: InlineCustomerPayload? =
        existing.isEmpty && !name.isEmpty
            ? InlineCustomerPayload(name: name, phone: nonEmpty(customerPhone))
            : nil
    return SaleCreatePayload(
        imei: imei,
        salePrice: salePrice,
        clientMutationId: clientMutationId,
        expectedVersion: expectedVersion,
        customerId: existing.isEmpty ? nil : existing,
        customer: inline,
        warrantyDays: warrantyDays,
        notes: nonEmpty(notes)
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

#if DEBUG
/// Self-check for the payload builder's two rules: inline/existing exclusivity
/// and omission of absent optionals (so `forbidNonWhitelisted` never trips).
enum PosSelfCheck {
    static let ran: Void = {
        func keys(_ p: SaleCreatePayload) -> Set<String> {
            let data = try! JSONEncoder().encode(p)
            let obj = try! JSONSerialization.jsonObject(with: data) as! [String: Any]
            return Set(obj.keys)
        }
        // Inline customer wins only when no existing id; absent optionals omitted.
        let inline = buildSalePayload(
            imei: "123456789012345", salePrice: 100, clientMutationId: "m",
            expectedVersion: 3, customerId: nil, customerName: " Ali ",
            customerPhone: nil, warrantyDays: nil, notes: "  ")
        assert(inline.customer?.name == "Ali" && inline.customerId == nil)
        assert(!keys(inline).contains("warrantyDays"))
        assert(!keys(inline).contains("notes"))
        assert(!keys(inline).contains("customerId"))
        // Existing id suppresses the inline customer.
        let existing = buildSalePayload(
            imei: "123456789012345", salePrice: 100, clientMutationId: "m",
            expectedVersion: 3, customerId: "cust-1", customerName: "Ali",
            customerPhone: "+998", warrantyDays: 30, notes: "n")
        assert(existing.customerId == "cust-1" && existing.customer == nil)
        assert(moneyToDouble("1250.50") == 1250.5)
    }()
}
#endif
