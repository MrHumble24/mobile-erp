import Foundation

/// Minimal customs reads the Reports "Customs fees" tab needs (ADR 0027). The
/// Reports slice owns its own DTO — it may not import the customs slice. Fees
/// stay decimal strings; the chart converts to Double only for the bar height.

/// A pickable customs code, from the current list's items.
struct ReportCustomsCode: Decodable, Identifiable {
    let customsCode: String
    let description: String?
    var id: String { customsCode }
    var label: String {
        guard let d = description, !d.isEmpty else { return customsCode }
        return "\(customsCode) · \(d)"
    }
}

/// The current list wrapper, just enough to read its codes (or null → no list).
struct ReportCurrentList: Decodable { let items: [ReportCustomsCode] }

/// One point of a code's fee over time, oldest first.
struct ReportFeePoint: Decodable, Identifiable {
    let listId: String
    let effectiveAt: String
    let fee: String
    var id: String { listId }
}
