import SwiftUI

/// Suppliers CRUD list. `shipment.manage` users get create/edit; everyone with
/// `shipment.read` sees the list.
struct SuppliersListView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var store: AsyncStore<[Supplier]>?
    @State private var showNew = false
    @State private var editing: Supplier?

    private var canManage: Bool { container.session.can("shipment.manage") }

    var body: some View {
        Group {
            if let store {
                LoadableView(state: store.state, retry: reload) { suppliers in
                    list(suppliers)
                }
            } else {
                LoadingView()
            }
        }
        .task {
            if store == nil {
                let repo = SuppliersRepository(api: container.api)
                store = AsyncStore { try await repo.list() }
            }
            await store?.reload()
        }
        .sheet(isPresented: $showNew, onDismiss: reload) {
            SupplierFormSheet(existing: nil)
        }
        .sheet(item: $editing, onDismiss: reload) { supplier in
            SupplierFormSheet(existing: supplier)
        }
        .toolbar {
            if canManage {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showNew = true
                    } label: {
                        Label(i18n.t("shipments.newSupplier"), systemImage: "plus")
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func list(_ suppliers: [Supplier]) -> some View {
        if suppliers.isEmpty {
            EmptyStateView(systemImage: "building.2", title: i18n.t("shipments.empty"))
                .frame(maxHeight: .infinity, alignment: .top)
                .padding(.top, 40)
        } else {
            List {
                ForEach(suppliers) { supplier in
                    SupplierRow(supplier: supplier)
                        .contentShape(Rectangle())
                        .onTapGesture { if canManage { editing = supplier } }
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .listRowBackground(Tokens.surface)
            .background(Tokens.bg)
        }
    }

    private func reload() { Task { await store?.reload() } }
}

private struct SupplierRow: View {
    @Environment(I18n.self) private var i18n
    let supplier: Supplier

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(supplier.name)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(Tokens.ink)
                let subtitle = [supplier.country, supplier.contact]
                    .compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · ")
                if !subtitle.isEmpty {
                    Text(subtitle).font(.caption).foregroundStyle(.secondary)
                }
            }
            Spacer()
            StatusBadge(
                i18n.t(supplier.isActive ? "shipments.supplierActive" : "common.no"),
                color: supplier.isActive ? Tokens.success : Tokens.ash
            )
        }
        .padding(.vertical, 4)
    }
}
