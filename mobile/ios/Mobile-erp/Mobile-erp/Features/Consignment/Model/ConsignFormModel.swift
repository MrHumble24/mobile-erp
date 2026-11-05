import Foundation

/// Drives the consign-device form: a shared partner / due-date / notes plus one
/// or more `{imei, agreedPrice}` rows. `submit()` calls the offline-capable
/// writer once per row (each with its own idempotency key), so a partial batch
/// never double-writes on retry. Partner options come from the same local
/// mirror / `/partners` source the directory uses (this slice owns both).
@MainActor
@Observable
final class ConsignFormModel {
    struct DeviceRow: Identifiable {
        let id = UUID()
        var imei = ""
        var agreedPrice = ""
    }

    struct SubmitResult {
        let created: Int
        /// True when at least one row was queued offline (show "pending sync").
        let queued: Bool
    }

    @ObservationIgnored private let writer: ConsignmentWriter
    @ObservationIgnored private let partnerRepo: PartnerRepository
    @ObservationIgnored private let isOnline: () -> Bool

    var partnerId: String
    let lockPartner: Bool
    var dueDate = Date()
    var notes = ""
    var rows: [DeviceRow] = [DeviceRow()]
    private(set) var partners: [Partner] = []
    private(set) var isSubmitting = false

    init(writer: ConsignmentWriter, partnerRepo: PartnerRepository,
         isOnline: @escaping () -> Bool, initialPartnerId: String?, lockPartner: Bool) {
        self.writer = writer
        self.partnerRepo = partnerRepo
        self.isOnline = isOnline
        self.partnerId = initialPartnerId ?? ""
        self.lockPartner = lockPartner
    }

    func loadPartners() async {
        if isOnline(), let list = try? await partnerRepo.listOnline() {
            partners = list.filter { $0.isActive }
        } else {
            partners = partnerRepo.listCached()
        }
    }

    func addRow() { rows.append(DeviceRow()) }

    func removeRow(_ id: UUID) {
        guard rows.count > 1 else { return }
        rows.removeAll { $0.id == id }
    }

    var canSubmit: Bool {
        !partnerId.isEmpty && rows.contains { isValid($0) }
    }

    private func isValid(_ row: DeviceRow) -> Bool {
        !row.imei.trimmingCharacters(in: .whitespaces).isEmpty
            && (Double(row.agreedPrice) ?? 0) > 0
    }

    func submit() async throws -> SubmitResult {
        isSubmitting = true
        defer { isSubmitting = false }
        var created = 0
        var queued = false
        for row in rows where isValid(row) {
            let outcome = try await writer.create(
                code: row.imei.trimmingCharacters(in: .whitespaces),
                partnerId: partnerId,
                agreedPrice: Double(row.agreedPrice) ?? 0,
                dueDate: dueDate,
                notes: notes.trimmingCharacters(in: .whitespaces).isEmpty ? nil : notes)
            created += 1
            if outcome == .queued { queued = true }
        }
        return SubmitResult(created: created, queued: queued)
    }
}
