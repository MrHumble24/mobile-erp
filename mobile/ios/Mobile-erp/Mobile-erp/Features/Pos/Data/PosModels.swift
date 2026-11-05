import Foundation

/// A device resolved for checkout from the local SwiftData cache (offline-first
/// IMEI lookup). Normalized to the fields POS needs.
struct ScannedDevice: Identifiable {
    let id: String
    /// Null on a serial unit (ADR 0029); exactly one of imei/serialNumber is set.
    let imei: String?
    let imei2: String?
    let serialNumber: String?
    /// The cached optimistic-lock version. Nil for a unit tapped in the catalog
    /// (ADR 0031): the sale then omits `expectedVersion` and the server uses the
    /// device's current version.
    let version: Int?
    let statusCode: String
    let modelLabel: String
    let targetPrice: String?
    /// Resolved list prices per level (ADR 0034). Empty when none are set — the
    /// line then behaves as it did before (the seller types the price).
    var prices: PriceLevelPrices = PriceLevelPrices()

    var inStock: Bool { statusCode == "IN_STOCK" }
    /// The code to show / dedupe by: the IMEI when present, else the serial.
    var code: String { UnitCode.display(imei: imei, serialNumber: serialNumber) }
}

/// A quantity product resolved for the cart (ADR 0030) — from the local product
/// cache offline, or `GET /scan/:code` / `GET /stock?search=` online.
struct PosCartProduct: Equatable, Identifiable {
    let modelId: String
    let name: String
    let barcode: String?
    /// Default till price per piece; nil when unset.
    let salePrice: String?
    /// Pieces currently in stock (may be negative) — drives the over-stock warning.
    let quantityInStock: Int
    /// Resolved list prices **per piece** per level (ADR 0034). Empty when none.
    var prices: PriceLevelPrices = PriceLevelPrices()

    var id: String { modelId }
}

/// `GET /scan/:code` answer (ADR 0030): a unit or a quantity product; `product`
/// is set only when `kind == "product"`.
struct ScanResultDTO: Decodable {
    let kind: String
    let product: ProductScanDTO?
}

/// The quantity-product branch of a scan result (`QuantityProductView`).
struct ProductScanDTO: Decodable {
    let modelId: String
    let brand: String
    let name: String
    let barcode: String?
    let salePrice: String?
    let quantity: Int
    /// Resolved per-piece prices per level (ADR 0034); nil on older responses.
    let prices: PriceLevelPrices?
}

/// A scanned IMEI awaiting the cashier's confirmation before it joins the cart.
/// `device` is set when the scan resolved to a sellable unit; otherwise it is nil
/// and `errorKey` names the gate that failed (rendered in the sheet's error
/// variant). Identifiable so it drives a `.sheet(item:)`.
struct PendingScan: Identifiable {
    let id = UUID()
    let code: String
    let device: ScannedDevice?
    let errorKey: String?
}

/// Result of a checkout, rendered as the receipt. Built from local data so it is
/// identical online and offline — a queued sale has no server response to await.
struct CompletedSale: Identifiable {
    var id: String { receiptId }
    let receiptId: String
    let imei: String?
    let imei2: String?
    let serialNumber: String?
    let modelLabel: String
    /// Pieces, for a quantity line (ADR 0030); nil for a unit line.
    let quantity: Int?
    /// Price per piece, for a quantity line; nil for a unit line.
    let unitPrice: String?

    /// The code to show on the receipt: IMEI when present, else the serial.
    var unitCode: String { UnitCode.display(imei: imei, serialNumber: serialNumber) }
    /// "× N" for a quantity line; empty for a unit line.
    var quantityLabel: String { quantity.map { "× \($0)" } ?? "" }
    let salePrice: String
    let soldAt: Date
    let cashier: String
    let warrantyDays: Int?
    let warrantyEndsAt: Date?
    let customerName: String?
    /// True when queued offline (awaiting `/sync/push`) — shown as "pending sync".
    let pending: Bool
    /// Pricing (ADR 0034) — shown on the receipt only when there was a discount
    /// or a non-retail level. `listPrice`/`discountAmount` are money strings.
    var listPrice: String? = nil
    var discountAmount: String? = nil
    var priceLevelCode: String? = nil

    /// Whether to surface the pricing block: a discount was given or the level
    /// was not walk-in.
    var showsPricing: Bool {
        (Decimal(string: discountAmount ?? "0") ?? 0) > 0
            || (priceLevelCode != nil && priceLevelCode != PriceLevels.retail)
    }
}

/// One cart line with its editable sale terms: a **unit** (phone/serial) or a
/// **quantity product** (ADR 0030). `price` is the whole price for a unit, the
/// price per piece for a product; `lineTotal` is what the server charges. Price
/// and warranty are strings (bound to fields); `clientMutationId` is stable so a
/// retry or an offline enqueue stays idempotent for this line.
struct PosCartLine: Identifiable {
    let id: String
    /// Set for a unit line; nil for a quantity line.
    let device: ScannedDevice?
    /// Set for a quantity line; nil for a unit line.
    let product: PosCartProduct?
    var price: String
    var quantity: Int
    var warrantyDays: String
    var notes: String
    let clientMutationId: String
    /// Discount on this line (ADR 0034). Mode + raw value text; applies only when
    /// the line has a list price for the current level.
    var discountMode: PosDiscountMode = .none
    var discountValue: String = ""
    /// A `sale.price.override` user typed a free price; then the list price and
    /// discount are ignored and `price` is sent as-is.
    var priceOverridden: Bool = false

    var isProduct: Bool { product != nil }

    /// The unit's / product's resolved list prices per level.
    var prices: PriceLevelPrices { device?.prices ?? product?.prices ?? PriceLevelPrices() }

    /// The whole-line list price for a level (per-piece × quantity for a product),
    /// or nil when the shop set no price for this line at that level.
    func listPrice(_ level: String) -> Decimal? {
        guard let per = prices.decimal(level) else { return nil }
        return isProduct ? per * Decimal(quantity) : per
    }

    /// The line's discount value as an exact Decimal (0 when blank).
    var discountDecimal: Decimal { Decimal(string: discountValue.trimmingCharacters(in: .whitespaces)) ?? 0 }
    /// Code to show: the unit code, else the product's barcode. A catalog quantity
    /// product has no barcode, so its row shows only the name (never a raw id).
    var code: String { device?.code ?? product?.barcode ?? "" }
    var modelLabel: String { device?.modelLabel ?? product?.name ?? "" }
    /// What the server charges: per-piece × quantity for a product, else the price.
    var lineTotal: Decimal {
        let p = Decimal(string: price.trimmingCharacters(in: .whitespaces)) ?? .zero
        return isProduct ? p * Decimal(quantity) : p
    }
    /// A quantity line selling more than is in stock — warn, never block (ADR 0030).
    var exceedsStock: Bool {
        guard let product else { return false }
        return quantity > product.quantityInStock
    }
}

/// The cart's shared customer: an existing one (`id` set, from typeahead) or an
/// inline new one (`id` nil, `name` set). Mutually exclusive, enforced by
/// `buildSalePayload`.
struct PosCartCustomer: Equatable {
    var id: String?
    var name: String
    var phone: String?
    /// The customer's price level and standing discount (ADR 0034), carried so
    /// the till can follow them. Defaults: walk-in, no standing discount.
    var level: String = PriceLevels.defaultCode
    var standing: Decimal = 0
}

/// A typeahead hit from `/customers/lookup` for attaching an existing customer.
/// Carries the customer's level + standing discount so the till can follow them.
struct PosCustomerHit: Decodable, Identifiable {
    let id: String
    let name: String
    let phone: String?
    let priceLevelCode: String?
    let standingDiscountPercent: String?

    var level: String { priceLevelCode ?? PriceLevels.defaultCode }
    var standing: Decimal { Decimal(string: standingDiscountPercent ?? "") ?? 0 }
}

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
    listPrice: Double? = nil
) -> SaleCreatePayload {
    let existing = (customerId ?? "").trimmingCharacters(in: .whitespaces)
    let name = (customerName ?? "").trimmingCharacters(in: .whitespaces)
    let inline: InlineCustomerPayload? =
        existing.isEmpty && !name.isEmpty
            ? InlineCustomerPayload(name: name, phone: nonEmpty(customerPhone))
            : nil
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
        listPrice: listPrice
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
