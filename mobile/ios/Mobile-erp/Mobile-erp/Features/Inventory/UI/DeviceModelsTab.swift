import SwiftUI

/// Models tab: searchable model list with create / edit (ADR 0013). Only shown
/// when the user has `device.update`, so writes are always allowed here.
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
        List {
            if let error = store.modelsError {
                Section { ErrorStateView(message: error, retry: { Task { await store.loadModels() } }) }
            }
            Section {
                if shown.isEmpty {
                    EmptyStateView(systemImage: "square.stack.3d.up", title: i18n.t("inventory.empty"))
                } else {
                    ForEach(shown) { model in
                        Button { editing = ModelTarget(model: model) } label: {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(model.label).font(.body.weight(.medium)).foregroundStyle(Tokens.ink)
                                    Text("\(model.attributes.count) \(i18n.t("inventory.attrSectionTitle").lowercased())")
                                        .font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                                StatusBadge(model.isActive ? i18n.t("common.yes") : i18n.t("common.no"),
                                            color: model.isActive ? Tokens.success : Tokens.slate)
                            }
                        }
                        .tint(.primary)
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .searchable(text: $query, prompt: "\(i18n.t("inventory.brand")) / \(i18n.t("inventory.model"))")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { editing = ModelTarget(model: nil) } label: {
                    Label(i18n.t("inventory.newModel"), systemImage: "plus")
                }
            }
        }
        .sheet(item: $editing) { target in
            ModelFormSheet(model: target.model, store: store)
        }
    }
}

private struct ModelTarget: Identifiable {
    let model: DeviceModelView?
    var id: String { model?.id ?? "new" }
}
