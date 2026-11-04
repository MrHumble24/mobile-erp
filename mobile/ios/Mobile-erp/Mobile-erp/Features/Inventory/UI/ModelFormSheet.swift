import SwiftUI

/// Create / edit a device model with its dynamic attribute schema (ADR 0013), as
/// a Warm Card sheet. On edit the model is fixed-key; brand / name / active /
/// attributes change. Online-only; a 409 means a duplicate brand+name.
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
    private var online: Bool { container.connectivity.isOnline }

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
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                HStack(alignment: .top, spacing: Tokens.Space.sm) {
                    Text(i18n.t(isEdit ? "inventory.editModel" : "inventory.newModel"))
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
                AppFormField(label: i18n.t("inventory.brand")) {
                    AppTextField(placeholder: i18n.t("inventory.brand"), text: $brand, autocapitalization: .words)
                }
                AppFormField(label: i18n.t("inventory.model")) {
                    AppTextField(placeholder: i18n.t("inventory.model"), text: $name, autocapitalization: .words)
                }
                if isEdit {
                    Toggle(i18n.t("inventory.modelActive"), isOn: $isActive)
                        .font(.ui(.body))
                        .foregroundStyle(Tokens.text)
                        .frame(minHeight: Tokens.Space.minTouch)
                }
                AttributesEditor(attributes: $attributes, savedKeys: savedKeys)
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
        .presentationDetents([.large])
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
            container.toasts.success(i18n.t("common.success"))
            dismiss()
        } catch let e as AppError {
            error = e.statusCode == 409 ? i18n.t("inventory.modelDuplicate") : e.message
        } catch {
            self.error = i18n.t("common.error")
        }
    }
}
