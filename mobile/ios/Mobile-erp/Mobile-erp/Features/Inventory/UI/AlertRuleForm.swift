import SwiftUI

/// Create / edit a stock-alert rule as a Warm Card sheet. On edit the model is
/// fixed (the server PATCH only changes storage + threshold). Online-only.
struct AlertRuleForm: View {
    let rule: StockAlertRuleView?
    let store: InventoryStore
    let onSaved: () async -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var modelId: String
    @State private var storage: String
    @State private var threshold: String
    @State private var saving = false
    @State private var error: String?

    private let fallbackStorages = ["64GB", "128GB", "256GB", "512GB", "1TB"]
    private var isEdit: Bool { rule != nil }
    private var online: Bool { container.connectivity.isOnline }

    init(rule: StockAlertRuleView?, store: InventoryStore, onSaved: @escaping () async -> Void) {
        self.rule = rule
        self.store = store
        self.onSaved = onSaved
        _modelId = State(initialValue: rule?.modelId ?? "")
        _storage = State(initialValue: rule?.storage ?? "")
        _threshold = State(initialValue: "\(rule?.threshold ?? 1)")
    }

    private var storages: [String] {
        let opts = store.deviceModels.first { $0.id == modelId }?
            .attributes.first { $0.key == "storage" }?.options ?? []
        return opts.isEmpty ? fallbackStorages : opts
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                HStack(alignment: .top, spacing: Tokens.Space.sm) {
                    Text(i18n.t(isEdit ? "inventory.editRule" : "inventory.newRule"))
                        .font(.ui(.title))
                        .foregroundStyle(Tokens.text)
                    Spacer(minLength: Tokens.Space.sm)
                    Button { dismiss() } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Tokens.text)
                            .frame(width: Tokens.Space.minTouch, height: Tokens.Space.minTouch)
                            .background(Tokens.surface2, in: Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(i18n.t("common.cancel"))
                }
                AppFormField(label: i18n.t("inventory.model")) {
                    AppSelect(placeholder: i18n.t("inventory.model"), selection: $modelId,
                              options: store.deviceModels.map { ($0.id, $0.label) })
                        .disabled(isEdit)
                        .opacity(isEdit ? 0.6 : 1)
                }
                AppFormField(label: i18n.t("inventory.storage")) {
                    AppSelect(placeholder: i18n.t("inventory.storage"), selection: $storage,
                              options: storages.map { ($0, $0) })
                }
                AppFormField(label: i18n.t("inventory.threshold")) {
                    AppTextField(placeholder: i18n.t("inventory.threshold"), text: $threshold,
                                 keyboard: .numberPad, font: .data(.regular))
                        .sanitizeDigits($threshold)
                }
                if let error {
                    Text(error).font(.ui(.caption)).foregroundStyle(Tokens.danger)
                }
                if !online {
                    Label(i18n.t("common.offline", default: "Offline"), systemImage: "wifi.slash")
                        .font(.ui(.caption)).foregroundStyle(Tokens.warning)
                }
                Button {
                    Task { await save() }
                } label: {
                    Text(saving ? i18n.t("common.loading") : i18n.t("common.save"))
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillPrimary)
                .disabled(saving || !online)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
    }

    private func save() async {
        guard !modelId.isEmpty, !storage.isEmpty,
              let value = Int(threshold.trimmingCharacters(in: .whitespaces)), value >= 0 else {
            error = i18n.t("common.required"); return
        }
        saving = true
        error = nil
        defer { saving = false }
        do {
            let repo = StockAlertRepository(container)
            if let rule {
                try await repo.update(id: rule.id, storage: storage, threshold: value)
            } else {
                try await repo.create(modelId: modelId, storage: storage, threshold: value)
            }
            await onSaved()
            container.toasts.success(i18n.t("common.success"))
            dismiss()
        } catch let e as AppError {
            error = e.message
        } catch {
            self.error = i18n.t("common.error")
        }
    }
}
