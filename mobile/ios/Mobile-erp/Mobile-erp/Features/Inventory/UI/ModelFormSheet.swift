import SwiftUI

/// Create / edit a product (device model) with its kind, category, barcode,
/// maker's model code and dynamic attribute schema (ADR 0013/0029), as a Warm
/// Card sheet. Online-only. A 409 is a duplicate name/barcode or a kind change
/// on a product that already has units (then `catalog.kindLocked`).
struct ModelFormSheet: View {
    let model: DeviceModelView?
    let store: InventoryStore

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var brand: String
    @State private var name: String
    @State private var isActive: Bool
    @State private var kindCode: String
    @State private var categoryId: String?
    @State private var barcode: String
    @State private var modelCode: String
    @State private var customsCode: String
    @State private var attributes: [AttributeDef]
    @State private var saving = false
    @State private var error: String?

    private let savedKeys: Set<String>
    private let originalKind: String
    private var isEdit: Bool { model != nil }
    private var online: Bool { container.connectivity.isOnline }

    init(model: DeviceModelView?, store: InventoryStore) {
        self.model = model
        self.store = store
        _brand = State(initialValue: model?.brand ?? "")
        _name = State(initialValue: model?.name ?? "")
        _isActive = State(initialValue: model?.isActive ?? true)
        _kindCode = State(initialValue: model?.kindCode ?? "IMEI")
        _categoryId = State(initialValue: model?.categoryId)
        _barcode = State(initialValue: model?.barcode ?? "")
        _modelCode = State(initialValue: model?.modelCode ?? "")
        _customsCode = State(initialValue: model?.customsCode ?? "")
        _attributes = State(initialValue: model?.attributes ?? [])
        savedKeys = Set((model?.attributes ?? []).map(\.key))
        originalKind = model?.kindCode ?? "IMEI"
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                titleRow
                AppFormField(label: i18n.t("inventory.brand")) {
                    AppTextField(placeholder: i18n.t("inventory.brand"), text: $brand, autocapitalization: .words)
                }
                AppFormField(label: i18n.t("inventory.model")) {
                    AppTextField(placeholder: i18n.t("inventory.model"), text: $name, autocapitalization: .words)
                }
                kindField
                categoryField
                AppFormField(label: i18n.t("catalog.barcode")) {
                    AppTextField(placeholder: i18n.t("catalog.barcode"), text: $barcode, autocapitalization: .characters)
                    Text(i18n.t("catalog.barcodeHint")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                AppFormField(label: i18n.t("catalog.modelCode")) {
                    AppTextField(placeholder: i18n.t("catalog.modelCode"), text: $modelCode, autocapitalization: .characters)
                    Text(i18n.t("catalog.modelCodeHint")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                if isEdit {
                    Toggle(i18n.t("inventory.modelActive"), isOn: $isActive)
                        .font(.ui(.body)).foregroundStyle(Tokens.text)
                        .frame(minHeight: Tokens.Space.minTouch)
                }
                AppFormField(label: i18n.t("inventory.customsCode")) {
                    AppTextField(placeholder: i18n.t("inventory.customsCode"), text: $customsCode,
                                 autocapitalization: .characters)
                    Text(i18n.t("inventory.customsCodeHint")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                AttributesEditor(attributes: $attributes, savedKeys: savedKeys)
                if let error {
                    Text(error).font(.ui(.caption)).foregroundStyle(Tokens.danger)
                }
                if !online {
                    Label(i18n.t("common.offline", default: "Offline"), systemImage: "wifi.slash")
                        .font(.ui(.caption)).foregroundStyle(Tokens.warning)
                }
                Button { Task { await save() } } label: {
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
        .task { await store.loadCategories() }
    }

    private var titleRow: some View {
        HStack(alignment: .top, spacing: Tokens.Space.sm) {
            Text(i18n.t(isEdit ? "inventory.editModel" : "inventory.newModel"))
                .font(.ui(.title)).foregroundStyle(Tokens.text)
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
    }

    private var kindField: some View {
        AppFormField(label: i18n.t("catalog.productKind")) {
            AppSelect(placeholder: i18n.t("catalog.productKind"), selection: $kindCode,
                      options: ProductKind.all.map { ($0, i18n.t(ProductKind.labelKey($0))) })
            Text(i18n.t(ProductKind.hintKey(kindCode))).font(.ui(.caption)).foregroundStyle(Tokens.muted)
            if isEdit {
                Text(i18n.t("catalog.kindLocked")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
            }
        }
    }

    private var categoryField: some View {
        AppFormField(label: i18n.t("catalog.category")) {
            AppSelect(placeholder: i18n.t("catalog.noCategory"), selection: $categoryId,
                      options: [(String?.none, i18n.t("catalog.noCategory"))]
                          + store.categories.map { (String?.some($0.id), $0.name) })
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
                try await repo.update(id: model.id, brand: b, name: n, isActive: isActive,
                                      kindCode: kindCode, categoryId: categoryId,
                                      barcode: nilIfBlank(barcode), modelCode: nilIfBlank(modelCode),
                                      customsCode: nilIfBlank(customsCode), attributes: reindexed)
            } else {
                try await repo.create(brand: b, name: n, kindCode: kindCode, categoryId: categoryId,
                                      barcode: nilIfBlank(barcode), modelCode: nilIfBlank(modelCode),
                                      customsCode: nilIfBlank(customsCode), attributes: reindexed)
            }
            await store.loadModels()
            container.toasts.success(i18n.t("common.success"))
            dismiss()
        } catch let e as AppError {
            error = message(for: e)
        } catch {
            self.error = i18n.t("common.error")
        }
    }

    /// Map a 409 to the right localized reason. The server reports one conflict at
    /// a time; we read its message to pick barcode vs kind-lock vs duplicate name.
    private func message(for e: AppError) -> String {
        guard e.statusCode == 409 else { return e.message }
        let m = e.message.lowercased()
        if m.contains("barcode") { return i18n.t("catalog.errorBarcodeExists") }
        if m.contains("kind") || (isEdit && kindCode != originalKind) { return i18n.t("catalog.kindLocked") }
        return i18n.t("inventory.modelDuplicate")
    }

    private func nilIfBlank(_ value: String) -> String? {
        let t = value.trimmingCharacters(in: .whitespaces)
        return t.isEmpty ? nil : t
    }
}
