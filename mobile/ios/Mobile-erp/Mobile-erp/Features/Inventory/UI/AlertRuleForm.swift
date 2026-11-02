import SwiftUI

/// Create / edit a stock-alert rule. On edit the model is fixed (the server
/// PATCH only changes storage + threshold). Online-only.
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
        NavigationStack {
            Form {
                Section {
                    Picker(i18n.t("inventory.model"), selection: $modelId) {
                        Text("—").tag("")
                        ForEach(store.deviceModels) { Text($0.label).tag($0.id) }
                    }
                    .disabled(isEdit)

                    Picker(i18n.t("inventory.storage"), selection: $storage) {
                        Text("—").tag("")
                        ForEach(storages, id: \.self) { Text($0).tag($0) }
                    }

                    TextField(i18n.t("inventory.threshold"), text: $threshold)
                        .keyboardType(.numberPad)
                }
                if let error {
                    Section { Text(error).font(.footnote).foregroundStyle(Tokens.danger) }
                }
            }
            .navigationTitle(i18n.t(isEdit ? "inventory.editRule" : "inventory.newRule"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.save")) { Task { await save() } }
                        .disabled(saving || !container.connectivity.isOnline)
                }
            }
        }
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
            dismiss()
        } catch let e as AppError {
            error = e.message
        } catch {
            self.error = i18n.t("common.error")
        }
    }
}
