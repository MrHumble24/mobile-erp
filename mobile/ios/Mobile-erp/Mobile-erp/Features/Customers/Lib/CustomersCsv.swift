import Foundation

/// Maps customers into CSV headers + rows for `KitCSVShareButton`, with their
/// purchase aggregates. Mirrors the web `exportCustomersCsv`.
enum CustomersCsv {
    static let headers = ["Name", "Phone", "Purchases", "Total Spent",
                          "Last Purchase", "Active Warranties", "Returns", "Created"]

    static func rows(_ customers: [CustomerListItem]) -> [[String]] {
        customers.map { c in
            [c.name, c.phone ?? "", "\(c.purchaseCount)", c.totalSpentString,
             c.lastPurchaseAt.map { String($0.prefix(10)) } ?? "",
             "\(c.activeWarranties)", "\(c.returnsCount)",
             c.createdAt.map { String($0.prefix(10)) } ?? ""]
        }
    }
}
