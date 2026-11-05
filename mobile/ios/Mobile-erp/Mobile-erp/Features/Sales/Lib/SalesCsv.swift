import Foundation

/// Maps the loaded sales into CSV headers + rows for `KitCSVShareButton`. Cost
/// column (net profit) is included only when the caller may view it. Mirrors
/// the web `exportSalesCsv`.
enum SalesCsv {
    static func headers(includeProfit: Bool) -> [String] {
        ["Brand", "Model", "IMEI", "Channel", "Customer", "Phone", "Sale Price"]
            + (includeProfit ? ["Net Profit"] : [])
            + ["Cashier", "Sold At"]
    }

    static func rows(_ sales: [SaleView], includeProfit: Bool) -> [[String]] {
        sales.map { s in
            [s.modelBrand, s.modelName, s.unitCode.isEmpty ? s.quantityLabel : s.unitCode,
             s.isB2B ? "B2B" : "Retail",
             s.customer?.name ?? "", s.customer?.phone ?? "",
             s.salePrice.string]
            + (includeProfit ? [s.netProfit?.string ?? ""] : [])
            + [s.soldBy.name, s.soldAt ?? ""]
        }
    }
}
