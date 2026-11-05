import Foundation

/// Devices data access. The list is read offline from the SwiftData cache (see
/// `DeviceListItem`); detail, history and writes go to the API online-only.
@MainActor
struct DeviceRepository {
    let api: APIClient

    init(_ container: AppContainer) {
        self.api = container.api
    }

    func detailByImei(_ imei: String) async throws -> DeviceDetail {
        let json = try await api.getJSON("/devices/by-imei/\(imei)")
        guard let detail = DeviceDetail(json: json) else {
            throw AppError(statusCode: 0, message: "Unexpected response")
        }
        return detail
    }

    func history(_ id: String) async throws -> [DeviceHistoryEntry] {
        try await api.get("/devices/\(id)/history")
    }

    func update(id: String, specs: [String: Any], targetPrice: Double?, imei2: String?) async throws {
        var body: [String: Any] = ["specs": specs]
        body["targetPrice"] = targetPrice ?? NSNull()
        body["imei2"] = imei2 ?? NSNull()   // null clears the second IMEI
        try await api.patchJSONVoid("/devices/\(id)", body)
    }

    /// Set a phone's own expense (`device.expense`). Posts the DEVICE_EXPENSE
    /// difference server-side (ADR 0026). `note == nil`/empty clears the note.
    /// Decimal→NSDecimalNumber keeps the JSON an exact number, never a Double.
    func setExpense(id: String, unitExpense: Decimal, note: String?) async throws {
        var body: [String: Any] = ["unitExpense": NSDecimalNumber(decimal: unitExpense)]
        body["unitExpenseNote"] = (note?.isEmpty == false) ? note! : NSNull()
        try await api.patchJSONVoid("/devices/\(id)/expense", body)
    }

    /// Hand-fix a phone's customs fee (`customs.manage`). Posts the CUSTOMS
    /// difference server-side (ADR 0027).
    func setCustomsFee(id: String, customsFee: Decimal) async throws {
        try await api.patchJSONVoid("/devices/\(id)/customs-fee",
                                    ["customsFee": NSDecimalNumber(decimal: customsFee)])
    }

    /// Throws `AppError` with `statusCode == 409` on a version mismatch.
    func changeStatus(id: String, toStatusCode: String,
                      expectedVersion: Int, reason: String?) async throws {
        try await api.postVoid("/devices/\(id)/status",
                               body: ChangeStatusBody(toStatusCode: toStatusCode,
                                                      expectedVersion: expectedVersion,
                                                      reason: reason?.isEmpty == true ? nil : reason))
    }

    private struct ChangeStatusBody: Encodable {
        let toStatusCode: String
        let expectedVersion: Int
        let reason: String?
    }
}
