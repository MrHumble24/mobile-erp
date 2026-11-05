import SwiftUI

/// Manage product categories (ADR 0029): list, add and edit. Next to the product
/// catalog; guarded by the model permissions. Online-only. A duplicate name is a
/// 409 → `catalog.errorCategoryExists`.
struct CategoriesSheet: View {
    let store: InventoryStore
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @State private var editing: CategoryTarget?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Tokens.Space.md) {
                    if store.categories.isEmpty {
                        AppCard { EmptyStateView(systemImage: "folder", title: i18n.t("catalog.categories")) }
                    } else {
                        ForEach(store.categories) { category in
                            Button { editing = CategoryTarget(category: category) } label: {
                                AppCard {
                                    HStack(spacing: Tokens.Space.sm) {
                                        Text(category.name).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                                        Spacer(minLength: Tokens.Space.sm)
                                        if !category.isActive {
                                            StatusBadge(i18n.t("common.no"), color: Tokens.sold)
                                        }
                                    }
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(Tokens.Space.gutter)
            }
            .background(Tokens.ground)
            .navigationTitle(i18n.t("catalog.categories"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.close")) { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button { editing = CategoryTarget(category: nil) } label: {
                        Label(i18n.t("catalog.newCategory"), systemImage: "plus")
                    }
                }
            }
            .task { await store.loadCategories() }
            .appSheet(item: $editing) { target in
                CategoryEditSheet(category: target.category, store: store)
            }
        }
    }
}

private struct CategoryTarget: Identifiable {
    let category: ProductCategory?
    var id: String { category?.id ?? "new" }
}

/// Add or edit one category.
struct CategoryEditSheet: View {
    let category: ProductCategory?
    let store: InventoryStore
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var name: String
    @State private var sortOrder: String
    @State private var isActive: Bool
    @State private var saving = false
    @State private var error: String?

    private var isEdit: Bool { category != nil }
    private var online: Bool { container.connectivity.isOnline }

    init(category: ProductCategory?, store: InventoryStore) {
        self.category = category
        self.store = store
        _name = State(initialValue: category?.name ?? "")
        _sortOrder = State(initialValue: category.map { String($0.sortOrder) } ?? "")
        _isActive = State(initialValue: category?.isActive ?? true)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                Text(i18n.t(isEdit ? "catalog.editCategory" : "catalog.newCategory"))
                    .font(.ui(.title)).foregroundStyle(Tokens.text)
                AppFormField(label: i18n.t("catalog.categoryName")) {
                    AppTextField(placeholder: i18n.t("catalog.categoryName"), text: $name, autocapitalization: .words)
                }
                AppFormField(label: i18n.t("catalog.sortOrder")) {
                    AppTextField(placeholder: "0", text: $sortOrder, keyboard: .numberPad)
                }
                if isEdit {
                    Toggle(i18n.t("inventory.modelActive"), isOn: $isActive)
                        .font(.ui(.body)).foregroundStyle(Tokens.text)
                        .frame(minHeight: Tokens.Space.minTouch)
                }
                if let error { Text(error).font(.ui(.caption)).foregroundStyle(Tokens.danger) }
                if !online {
                    Label(i18n.t("common.offline", default: "Offline"), systemImage: "wifi.slash")
                        .font(.ui(.caption)).foregroundStyle(Tokens.warning)
                }
                Button { Task { await save() } } label: {
                    Text(saving ? i18n.t("common.loading") : i18n.t("common.save")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillPrimary)
                .disabled(saving || !online)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.medium, .large])
    }

    private func save() async {
        let n = name.trimmingCharacters(in: .whitespaces)
        guard !n.isEmpty else { error = i18n.t("common.required"); return }
        saving = true
        error = nil
        defer { saving = false }
        let order = Int(sortOrder.trimmingCharacters(in: .whitespaces))
        do {
            let repo = ProductCategoryRepository(container)
            if let category {
                try await repo.update(id: category.id, name: n, sortOrder: order, isActive: isActive)
            } else {
                try await repo.create(name: n, sortOrder: order)
            }
            await store.loadCategories()
            container.toasts.success(i18n.t("catalog.categorySaved"))
            dismiss()
        } catch let e as AppError {
            error = e.statusCode == 409 ? i18n.t("catalog.errorCategoryExists") : e.message
        } catch {
            self.error = i18n.t("common.error")
        }
    }
}
