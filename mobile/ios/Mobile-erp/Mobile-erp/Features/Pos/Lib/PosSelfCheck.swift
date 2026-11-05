#if DEBUG
import Foundation

/// Self-checks for the POS payload builder, the quantity-line body and the
/// mixed-cart totals. Runs once on first POS appear.
enum PosSelfCheck {
    static let ran: Void = {
        checkPayload()
        checkMixedTotals()
    }()

    private static func keys(_ p: SaleCreatePayload) -> Set<String> {
        let data = try! JSONEncoder().encode(p)
        let obj = try! JSONSerialization.jsonObject(with: data) as! [String: Any]
        return Set(obj.keys)
    }

    private static func checkPayload() {
        // Inline customer wins only when no existing id; absent optionals omitted.
        let inline = buildSalePayload(
            imei: "123456789012345", salePrice: 100, clientMutationId: "m",
            expectedVersion: 3, customerId: nil, customerName: " Ali ",
            customerPhone: nil, warrantyDays: nil, notes: "  ")
        assert(inline.customer?.name == "Ali" && inline.customerId == nil)
        assert(!keys(inline).contains("warrantyDays"))
        assert(!keys(inline).contains("notes"))
        assert(keys(inline).contains("imei") && !keys(inline).contains("serialNumber"))
        assert(!keys(inline).contains("modelId") && !keys(inline).contains("quantity"))
        // A serial sale sends serialNumber, never imei (ADR 0029).
        let serial = buildSalePayload(
            serialNumber: "PS5-ABC", salePrice: 100, clientMutationId: "m",
            expectedVersion: 1, customerId: nil, customerName: nil,
            customerPhone: nil, warrantyDays: nil, notes: nil)
        assert(keys(serial).contains("serialNumber") && !keys(serial).contains("imei"))
        // A quantity sale sends modelId + quantity, no unit code, no version (ADR 0030).
        let qty = buildSalePayload(
            modelId: "model-1", quantity: 3, salePrice: 90, clientMutationId: "m",
            customerId: nil, customerName: nil, customerPhone: nil,
            warrantyDays: nil, notes: nil)
        assert(keys(qty).contains("modelId") && keys(qty).contains("quantity"))
        assert(!keys(qty).contains("imei") && !keys(qty).contains("serialNumber"))
        assert(!keys(qty).contains("expectedVersion"))
        assert(moneyToDouble("1250.50") == 1250.5)
    }

    /// A phone at 1,200,000 plus three pieces at 90,000 each → 1,470,000.
    private static func checkMixedTotals() {
        let phone = PosCartLine(id: "u", device: demoDevice, product: nil,
                                price: "1200000", quantity: 1, warrantyDays: "", notes: "",
                                clientMutationId: "a")
        let pieces = PosCartLine(id: "p", device: nil, product: demoProduct,
                                 price: "90000", quantity: 3, warrantyDays: "", notes: "",
                                 clientMutationId: "b")
        assert(phone.lineTotal == Decimal(1_200_000))
        assert(pieces.lineTotal == Decimal(270_000))
        let subtotal = [phone, pieces].reduce(Decimal.zero) { $0 + $1.lineTotal }
        assert(subtotal == Decimal(1_470_000))
        // Selling 3 of 2 in stock warns, never blocks.
        assert(pieces.exceedsStock)
    }

    private static let demoDevice = ScannedDevice(
        id: "d", imei: "356938035643809", imei2: nil, serialNumber: nil,
        version: 1, statusCode: "IN_STOCK", modelLabel: "iPhone 13", targetPrice: "1200000")
    private static let demoProduct = PosCartProduct(
        modelId: "model-1", name: "USB-C cable", barcode: "BC1", salePrice: "90000", quantityInStock: 2)
}
#endif
