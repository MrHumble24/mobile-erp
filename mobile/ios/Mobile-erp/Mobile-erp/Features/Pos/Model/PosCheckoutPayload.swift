import Foundation

/// Builds one line's `POST /sales` body and its on-screen receipt row, split out
/// of `PosViewModel` so the checkout loop stays short. A line sends a unit
/// (imei/serial + version) or a quantity product (modelId + quantity); its
/// trade-ins (ADR 0039) ride on the sale that nets them.
extension PosViewModel {
    /// The trade-ins allocated to `lineId`, as `SaleTradeInPost`s — nil when the
    /// line carries none (so the key is omitted and the server stays happy).
    func tradeInPosts(for lineId: String, plan: TradeInAllocation.Plan) -> [SaleTradeInPost]? {
        let ids = plan.itemsByLine[lineId] ?? []
        guard !ids.isEmpty else { return nil }
        let posts = cart.tradeIns.filter { ids.contains($0.id) }.map { t in
            SaleTradeInPost(
                modelId: t.modelId,
                imei: t.imei, imei2: t.imei2, serialNumber: t.serialNumber,
                specs: t.specs.isEmpty ? nil : t.specs,
                value: NSDecimalNumber(decimal: t.value).doubleValue)
        }
        return posts.isEmpty ? nil : posts
    }

    /// Build the sale request for a line: a unit (imei/serial + version) or a
    /// quantity product (modelId + quantity, no warranty). `salePrice` is the full
    /// line total (revenue intact); the trade-in values are netted off `payments`.
    func payload(for line: PosCartLine, customer: PosCartCustomer?,
                 payments: [SalePaymentPost], tradeIns: [SaleTradeInPost]?) -> SaleCreatePayload {
        let total = NSDecimalNumber(decimal: cart.finalTotal(line)).doubleValue
        let list = cart.listPrice(line)
        let listDouble = list.map { NSDecimalNumber(decimal: $0).doubleValue }
        // Send a discount only on a list-priced, non-overridden line with one set.
        let discount: SaleDiscountPost? = {
            guard list != nil, !line.priceOverridden,
                  line.discountMode != .none, line.discountDecimal > 0 else { return nil }
            return SaleDiscountPost(
                mode: line.discountMode == .percent ? "PERCENT" : "AMOUNT",
                value: NSDecimalNumber(decimal: line.discountDecimal).doubleValue)
        }()
        if let product = line.product {
            return buildSalePayload(
                modelId: product.modelId, quantity: line.quantity, salePrice: total,
                clientMutationId: line.clientMutationId,
                customerId: customer?.id,
                customerName: customer?.id == nil ? customer?.name : nil,
                customerPhone: customer?.id == nil ? customer?.phone : nil,
                warrantyDays: nil, notes: line.notes, payments: payments,
                priceLevelCode: cart.level, discount: discount, listPrice: listDouble,
                tradeIns: tradeIns)
        }
        return buildSalePayload(
            imei: line.device?.imei, serialNumber: line.device?.serialNumber, salePrice: total,
            clientMutationId: line.clientMutationId, expectedVersion: line.device?.version,
            customerId: customer?.id,
            customerName: customer?.id == nil ? customer?.name : nil,
            customerPhone: customer?.id == nil ? customer?.phone : nil,
            warrantyDays: Int(line.warrantyDays.trimmingCharacters(in: .whitespaces)),
            notes: line.notes, payments: payments,
            priceLevelCode: cart.level, discount: discount, listPrice: listDouble,
            tradeIns: tradeIns)
    }

    func completedSale(_ line: PosCartLine, receiptId: String, cashier: String,
                       customer: PosCartCustomer?, at now: Date, pending: Bool) -> CompletedSale {
        let days = line.isProduct ? nil : Int(line.warrantyDays.trimmingCharacters(in: .whitespaces))
        let final = cart.finalTotal(line)
        let list = cart.listPrice(line)
        let discount = list != nil ? (list! - final) : 0
        return CompletedSale(
            receiptId: receiptId,
            imei: line.device?.imei,
            imei2: line.device?.imei2,
            serialNumber: line.device?.serialNumber,
            modelLabel: line.modelLabel,
            quantity: line.isProduct ? line.quantity : nil,
            unitPrice: line.isProduct ? line.price : nil,
            salePrice: NSDecimalNumber(decimal: final).stringValue,
            soldAt: now,
            cashier: cashier,
            warrantyDays: days,
            warrantyEndsAt: days.map { now.addingTimeInterval(Double($0) * 86_400) },
            customerName: nonEmpty(customer?.name),
            pending: pending,
            listPrice: list.map { NSDecimalNumber(decimal: $0).stringValue },
            discountAmount: discount > 0 ? NSDecimalNumber(decimal: discount).stringValue : nil,
            priceLevelCode: cart.level
        )
    }
}
