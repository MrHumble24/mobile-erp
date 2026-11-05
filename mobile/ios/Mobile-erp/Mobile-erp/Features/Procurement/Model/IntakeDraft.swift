import Foundation

/// One device staged in the intake loop before the batch is POSTed. Costs are
/// operator-entered (not redacted reads), so they are plain Decimals here. A unit
/// carries an IMEI (phone) OR a serial number (ADR 0029); `code` identifies it
/// in the draft set, which rejects duplicates.
struct IntakeDraft: Identifiable {
    let imei: String?
    let imei2: String?
    let serialNumber: String?
    let modelId: String
    let specs: [String: String]
    let acquisitionCost: Decimal
    let targetPrice: Decimal?
    /// Per-phone expense entered at intake (ADR 0026); nil = not entered / no
    /// permission, so the field is omitted and the server defaults it to 0.
    let unitExpense: Decimal?
    let unitExpenseNote: String?

    /// The code to show / dedupe by: the IMEI when present, else the serial.
    var code: String { UnitCode.display(imei: imei, serialNumber: serialNumber) }
    var id: String { code }
    var specsSummary: String { specs.values.sorted().joined(separator: " · ") }

    var dto: IntakeDeviceDTO {
        IntakeDeviceDTO(imei: imei, imei2: imei2, serialNumber: serialNumber, modelId: modelId,
                        specs: specs, acquisitionCost: acquisitionCost, targetPrice: targetPrice,
                        unitExpense: unitExpense, unitExpenseNote: unitExpenseNote)
    }
}
