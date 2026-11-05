import Foundation
import Observation

/// Drives the intake code lookup (ADR 0031): resolves a box code (≥ 5 chars,
/// preferred) or a full IMEI to a reference and, when the lists name our product,
/// applies it (`apply`, force = automatic vs. manual pick). Debounced and
/// online-only so it never blocks or slows saving. UI reads `status`.
@MainActor
@Observable
final class IntakeLookup {
    var boxCode = "" { didSet { if boxCode != oldValue { resolve() } } }
    private(set) var status: Status = .none
    private(set) var reference: LookupReference?
    private(set) var canUpdate = false
    private(set) var remembered = false
    /// Set by the view: apply a product to the form (force = manual pick wins).
    var apply: ((LookupProduct, _ force: Bool) -> Void)?

    enum Status: Equatable {
        case none
        case found(String)
        case pick(brand: String, model: String, color: String?, storage: String?)
        case notFound
    }

    @ObservationIgnored private var container: AppContainer?
    @ObservationIgnored private var imei = ""
    @ObservationIgnored private var task: Task<Void, Never>?
    @ObservationIgnored private var handledCode: String?

    func configure(_ container: AppContainer) {
        guard self.container == nil else { return }
        self.container = container
        canUpdate = container.session.can("device.update")
    }

    /// The parent's IMEI slot — a full IMEI is itself a lookup input.
    func update(imei value: String) {
        let trimmed = value.trimmingCharacters(in: .whitespaces)
        guard trimmed != imei else { return }
        imei = trimmed
        resolve()
    }

    /// Manually chosen product for a reference the lists could not name; optionally
    /// remember the link for next time (admin only).
    func pick(modelId: String, remember: Bool, models: [DeviceModel]) {
        guard let model = models.first(where: { $0.id == modelId }), let container else { return }
        apply?(LookupProduct(modelId: modelId, brand: model.brand, name: model.name,
                             kindCode: model.kindCode, matchedBy: "manual",
                             storageOption: nil, colorOption: nil), true)
        guard remember, canUpdate, let reference else { return }
        Task {
            try? await LookupRepository(api: container.api)
                .teachLink(refBrand: reference.brand, refModel: reference.model, modelId: modelId)
            remembered = true
        }
    }

    // MARK: - resolution

    /// The code to look up: the box code when long enough, else a valid IMEI.
    private var code: String {
        let box = boxCode.trimmingCharacters(in: .whitespaces)
        if box.count >= LookupRepository.minCodeLength { return box }
        return Imei.isValid(imei) ? imei : ""
    }

    private func resolve() {
        task?.cancel()
        let code = self.code
        guard !code.isEmpty, let container else {
            if code.isEmpty { status = .none; reference = nil }
            return
        }
        task = Task { [weak self] in
            try? await Task.sleep(for: .milliseconds(400))
            guard let self, !Task.isCancelled else { return }
            await self.run(code: code, container: container)
        }
    }

    private func run(code: String, container: AppContainer) async {
        guard container.connectivity.isOnline, handledCode != code else { return }
        do {
            // `find` returns nil only for a 404; a network error throws and is
            // swallowed so the lookup never blocks saving (a retry resolves later).
            let result = try await LookupRepository(api: container.api).find(code: code)
            handledCode = code
            guard let result else { status = .notFound; reference = nil; return }
            reference = result.reference
            if let product = result.product {
                status = .found("\(result.reference.brand) \(result.reference.model)")
                apply?(product, false)
            } else {
                let r = result.reference
                status = .pick(brand: r.brand, model: r.model, color: r.color, storage: r.storage)
            }
        } catch {
            // Network/other — leave the status unchanged; saving is never gated.
        }
    }
}
