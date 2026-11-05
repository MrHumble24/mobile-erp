import Foundation
import Observation

/// The repair customer: an existing one (`id` set) or an inline new one
/// (name + phone). No passport / ID field — ever.
struct RepairCustomer: Equatable {
    var id: String?
    var name: String = ""
    var phone: String?
    var trimmedName: String { name.trimmingCharacters(in: .whitespacesAndNewlines) }
    var isSet: Bool { id != nil || !trimmedName.isEmpty }
}

/// Who repairs it: our own master (a user) or an outside master (name + phone +
/// what the shop pays). Never a passcode or ID.
enum RepairMasterMode: String, CaseIterable, Identifiable { case own, outside; var id: String { rawValue } }

/// The new-ticket draft (ADR 0040). All validation here so the sheet blocks
/// before the server. A passcode / pattern / ID field never exists.
@MainActor
@Observable
final class NewRepairDraft {
    var customer = RepairCustomer()
    var deviceName = ""
    var modelId: String?
    var imei = ""
    var serialNumber = ""
    var problem = ""
    var agreedPrice = ""
    var warrantyDays = ""
    var notes = ""

    var masterMode: RepairMasterMode = .own
    var ownMasterId: String?
    var outsideName = ""
    var outsidePhone = ""
    var outsideCost = ""

    private var priceDecimal: Decimal { Decimal(string: agreedPrice.trimmingCharacters(in: .whitespaces)) ?? .zero }

    var isValid: Bool {
        guard customer.isSet,
              !deviceName.trimmingCharacters(in: .whitespaces).isEmpty,
              !problem.trimmingCharacters(in: .whitespaces).isEmpty,
              priceDecimal >= 0, Int(warrantyDays.trimmingCharacters(in: .whitespaces)) != nil else { return false }
        switch masterMode {
        case .own: return true   // a master is optional
        case .outside: return !outsideName.trimmingCharacters(in: .whitespaces).isEmpty
        }
    }

    func payload() -> CreateRepairPayload? {
        guard isValid else { return nil }
        let inline: RepairCustomerPost? = customer.id == nil
            ? RepairCustomerPost(name: customer.trimmedName, phone: orNil(customer.phone)) : nil
        let outside = masterMode == .outside
        return CreateRepairPayload(
            customerId: customer.id,
            customer: inline,
            deviceName: deviceName.trimmingCharacters(in: .whitespaces),
            modelId: modelId,
            imei: orNil(imei),
            serialNumber: orNil(serialNumber.isEmpty ? nil : UnitCode.normalizeSerial(serialNumber)),
            problem: problem.trimmingCharacters(in: .whitespaces),
            agreedPrice: NSDecimalNumber(decimal: priceDecimal).doubleValue,
            warrantyDays: Int(warrantyDays.trimmingCharacters(in: .whitespaces)) ?? 0,
            notes: orNil(notes),
            masterUserId: outside ? nil : ownMasterId,
            outsideMasterName: outside ? orNil(outsideName) : nil,
            outsideMasterPhone: outside ? orNil(outsidePhone) : nil,
            outsideCost: outside ? (Decimal(string: outsideCost.trimmingCharacters(in: .whitespaces)).map { NSDecimalNumber(decimal: $0).doubleValue }) : nil)
    }

    private func orNil(_ v: String?) -> String? {
        let t = (v ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        return t.isEmpty ? nil : t
    }
}
