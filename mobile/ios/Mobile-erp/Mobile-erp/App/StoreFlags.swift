import Foundation
import Observation

/// A tiny cache of store-setting flags and shop identity that gate navigation
/// and format receipts without extra network calls.
/// Repairs is hidden entirely while `repairsEnabled` is off (ADR 0040),
/// bonus points and receipt printing are gated by their flags (ADR 0043),
/// and the store identity + footer are cached for receipts without another call.
/// This loads `GET /settings` once after sign-in (and again when settings are saved).
/// When a refresh fails (e.g. offline), the last loaded values are kept.
/// Defaults before the first load: bonus off, printing off, paper width 80 mm.
@MainActor
@Observable
final class StoreFlags {
    private(set) var repairsEnabled = false
    private(set) var bonusEnabled = false
    private(set) var receiptPrintingEnabled = false
    private(set) var receiptPaperWidthMm = 80
    private(set) var storeName: String?
    private(set) var storeAddress: String?
    private(set) var storePhone: String?
    private(set) var receiptFooter: String?

    private struct Flags: Decodable {
        let repairsEnabled: Bool?
        let bonusEnabled: Bool?
        let receiptPrintingEnabled: Bool?
        let receiptPaperWidthMm: Int?
        let storeName: String?
        let storeAddress: String?
        let storePhone: String?
        let receiptFooter: String?
    }

    func refresh(api: APIClient) async {
        guard let f: Flags = try? await api.get("/settings") else { return }
        repairsEnabled = f.repairsEnabled ?? false
        bonusEnabled = f.bonusEnabled ?? false
        receiptPrintingEnabled = f.receiptPrintingEnabled ?? false
        receiptPaperWidthMm = f.receiptPaperWidthMm ?? 80
        storeName = f.storeName
        storeAddress = f.storeAddress
        storePhone = f.storePhone
        receiptFooter = f.receiptFooter
    }
}
