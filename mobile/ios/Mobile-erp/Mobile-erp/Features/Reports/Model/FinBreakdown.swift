import Foundation

/// Which measure a by-model drill-down ranks on.
enum FinModelMeasure: String { case grossProfit, units }

/// A report drill-down request opened from a tile or breakdown row. The sheet
/// renders reports-owned detail; raw sales/device line items (web's
/// cross-entity breakdowns) are out of this slice's scope — see the README.
enum FinBreakdownRequest: Identifiable {
    case noi(from: Date?, to: Date?)
    case returns(from: Date?, to: Date?)
    case model(from: Date?, to: Date?, measure: FinModelMeasure)
    case salesRow(FinBreakdownRow)
    case partner(ConsignmentPartnerRow)
    case inventoryModel(InventoryModelRow)

    var id: String {
        switch self {
        case .noi: "noi"
        case .returns: "returns"
        case let .model(_, _, measure): "model-\(measure.rawValue)"
        case let .salesRow(row): "salesRow-\(row.key)"
        case let .partner(row): "partner-\(row.partnerId)"
        case let .inventoryModel(row): "invModel-\(row.modelId)"
        }
    }

    /// Sheet title (web i18n key under `reports.brk*`).
    var titleKey: String {
        switch self {
        case .noi: "reports.brkNoi"
        case .returns: "reports.brkReturns"
        case let .model(_, _, measure): measure == .units ? "reports.brkUnits" : "reports.brkGrossProfit"
        case .salesRow: "reports.brkSalesByModel"
        case .partner: "reports.brkPartner"
        case .inventoryModel: "reports.brkInventoryModel"
        }
    }
}
