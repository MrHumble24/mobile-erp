import SwiftUI

/// Create / edit a device model with its dynamic attribute schema (ADR 0013).
/// On edit the model is fixed-key; brand/name/active/attributes change.
struct ModelFormSheet: View {
    let model: DeviceModelView?
    let store: InventoryStore

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var brand: String
    @State private var name: String
    @State private var isActive: Bool
    @State private var attributes: [AttributeDef]
    @State private var saving = false
    @State private var error: String?

    private let savedKeys: Set<String>
    private var isEdit: Bool { model != nil }

    init(model: DeviceModelView?, store: InventoryStore) {
        self.model = model
        self.store = store
        _brand = State(initialValue: model?.brand ?? "")
        _name = State(initialValue: model?.name ?? "")
        _isActive = State(initialValue: model?.isActive ?? true)
        _attributes = State(initialValue: model?.attributes ?? [])
        savedKeys = Set((model?.attributes ?? []).map(\.key))
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField(i18n.t("inventory.brand"), text: $brand)
                    TextField(i18n.t("inventory.model"), text: $name)
                    if isEdit {
                        Toggle(i18n.t("inventory.modelActive"), isOn: $isActive)
                    }
                }
                AttributesEditor(attributes: $attributes, savedKeys: savedKeys)
                if let error {
                    Section { Text(error).font(.footnote).foregroundStyle(Tokens.danger) }
                }
            }
            .navigationTitle(i18n.t(isEdit ? "inventory.editModel" : "inventory.newModel"))
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
        let b = brand.trimmingCharacters(in: .whitespaces)
        let n = name.trimmingCharacters(in: .whitespaces)
        guard !b.isEmpty, !n.isEmpty else { error = i18n.t("common.required"); return }
        saving = true
        error = nil
        defer { saving = false }
        let reindexed = attributes.enumerated().map { i, a -> AttributeDef in
            var copy = a; copy.sortOrder = i; return copy
        }
        do {
            let repo = DeviceModelRepository(container)
            if let model {
                try await repo.update(id: model.id, brand: b, name: n,
                                      isActive: isActive, attributes: reindexed)
            } else {
                try await repo.create(brand: b, name: n, attributes: reindexed)
            }
            await store.loadModels()
            dismiss()
        } catch let e as AppError {
            error = e.statusCode == 409 ? i18n.t("inventory.modelDuplicate") : e.message
        } catch {
            self.error = i18n.t("common.error")
        }
    }
}
