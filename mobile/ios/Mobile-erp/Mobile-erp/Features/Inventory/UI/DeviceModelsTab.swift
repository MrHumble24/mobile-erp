import SwiftUI

/// Models tab: searchable model list as white cards on the ground, with create
/// (toolbar +) / edit (tap a row) — ADR 0013. Only shown when the user has
/// `device.update`, so writes are always allowed here.
struct DeviceModelsTab: View {
    let store: InventoryStore
    @Environment(I18n.self) private var i18n
    @State private var query = ""
    @State private var categoryFilter: String?
    @State private var editing: ModelTarget?
    @State private var showCategories = false

    private var shown: [DeviceModelView] {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        return store.deviceModels.filter { m in
            (q.isEmpty || m.label.lowercased().contains(q))
                && (categoryFilter == nil || m.categoryId == categoryFilter)
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                if !store.categories.isEmpty {
                    AppSelect(placeholder: i18n.t("catalog.allCategories"), selection: $categoryFilter,
                              options: [(String?.none, i18n.t("catalog.allCategories"))]
                                  + store.categories.map { (String?.some($0.id), $0.name) })
                }
                if let error = store.modelsError {
                    AppCard { ErrorStateView(message: error, retry: { Task { await store.loadModels() } }) }
                }
                if shown.isEmpty {
                    AppCard { EmptyStateView(systemImage: "square.stack.3d.up", title: i18n.t("inventory.empty")) }
                } else {
                    ForEach(shown) { model in
                        Button { editing = ModelTarget(model: model) } label: {
                            AppCard { ModelRow(model: model, category: store.categoryName(model.categoryId)) }
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.bottom, Tokens.Space.lg)
        }
        .background(Tokens.ground)
        .searchable(text: $query, prompt: "\(i18n.t("inventory.brand")) / \(i18n.t("inventory.model"))")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showCategories = true } label: {
                    Label(i18n.t("nav.categories"), systemImage: "folder")
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button { editing = ModelTarget(model: nil) } label: {
                    Label(i18n.t("inventory.newModel"), systemImage: "plus")
                }
            }
        }
        .appSheet(item: $editing) { target in
            ModelFormSheet(model: target.model, store: store)
        }
        .appSheet(isPresented: $showCategories) {
            CategoriesSheet(store: store)
        }
        #if DEBUG
        // Screenshot helper: `-openModel new|<id>` opens the form once models are loaded.
        .onChange(of: store.deviceModels.count, initial: true) { _, _ in
            // `accept` defers consuming the arg until the model is loadable, so
            // `-openModel <id>` opens once the catalog has arrived (not before).
            guard editing == nil, let arg = KitDebugLaunch.consume("openModel", accept: { value in
                value == "new" || store.deviceModels.contains { $0.id == value }
            }) else { return }
            if arg == "new" { editing = ModelTarget(model: nil) }
            else if let m = store.deviceModels.first(where: { $0.id == arg }) { editing = ModelTarget(model: m) }
        }
        // `-openCategories 1` opens the categories sheet.
        .onAppear {
            if !showCategories, KitDebugLaunch.consume("openCategories") == "1" { showCategories = true }
        }
        #endif
    }
}

/// One model card: label, attribute count, active pill — the Android `ModelRow`.
private struct ModelRow: View {
    let model: DeviceModelView
    let category: String?
    @Environment(I18n.self) private var i18n

    /// "Phone (IMEI) · Consoles" — the kind, then the category when set.
    private var subtitle: String {
        [i18n.t(ProductKind.labelKey(model.kindCode)), category]
            .compactMap { $0 }.joined(separator: " · ")
    }

    var body: some View {
        HStack(spacing: Tokens.Space.sm) {
            VStack(alignment: .leading, spacing: 2) {
                Text(model.label).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                Text(subtitle).font(.ui(.caption)).foregroundStyle(Tokens.muted)
            }
            Spacer(minLength: Tokens.Space.sm)
            StatusBadge(model.isActive ? i18n.t("inventory.modelActive") : i18n.t("common.no"),
                        color: model.isActive ? Tokens.success : Tokens.sold)
        }
    }
}

private struct ModelTarget: Identifiable {
    let model: DeviceModelView?
    var id: String { model?.id ?? "new" }
}
