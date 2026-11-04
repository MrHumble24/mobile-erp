import SwiftUI

/// Models tab: searchable model list as white cards on the ground, with create
/// (toolbar +) / edit (tap a row) — ADR 0013. Only shown when the user has
/// `device.update`, so writes are always allowed here.
struct DeviceModelsTab: View {
    let store: InventoryStore
    @Environment(I18n.self) private var i18n
    @State private var query = ""
    @State private var editing: ModelTarget?

    private var shown: [DeviceModelView] {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        return q.isEmpty ? store.deviceModels
            : store.deviceModels.filter { $0.label.lowercased().contains(q) }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                if let error = store.modelsError {
                    AppCard { ErrorStateView(message: error, retry: { Task { await store.loadModels() } }) }
                }
                if shown.isEmpty {
                    AppCard { EmptyStateView(systemImage: "square.stack.3d.up", title: i18n.t("inventory.empty")) }
                } else {
                    ForEach(shown) { model in
                        Button { editing = ModelTarget(model: model) } label: {
                            AppCard { ModelRow(model: model) }
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
                Button { editing = ModelTarget(model: nil) } label: {
                    Label(i18n.t("inventory.newModel"), systemImage: "plus")
                }
            }
        }
        .appSheet(item: $editing) { target in
            ModelFormSheet(model: target.model, store: store)
        }
        #if DEBUG
        // Screenshot helper: `-openModel new|<id>` opens the form once models are loaded.
        .onChange(of: store.deviceModels.count, initial: true) { _, _ in
            guard editing == nil, let arg = KitDebugLaunch.consume("openModel") else { return }
            if arg == "new" { editing = ModelTarget(model: nil) }
            else if let m = store.deviceModels.first(where: { $0.id == arg }) { editing = ModelTarget(model: m) }
        }
        #endif
    }
}

/// One model card: label, attribute count, active pill — the Android `ModelRow`.
private struct ModelRow: View {
    let model: DeviceModelView
    @Environment(I18n.self) private var i18n

    var body: some View {
        HStack(spacing: Tokens.Space.sm) {
            VStack(alignment: .leading, spacing: 2) {
                Text(model.label).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                Text("\(model.attributes.count) \(i18n.t("inventory.attrSectionTitle").lowercased())")
                    .font(.ui(.caption)).foregroundStyle(Tokens.muted)
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
