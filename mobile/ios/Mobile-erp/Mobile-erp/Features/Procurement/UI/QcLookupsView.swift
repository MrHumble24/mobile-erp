import SwiftUI

/// Manage QC grades and defect types (ADR 0014). Writes need `settings.manage`;
/// the active-only toggle filters inactive rows.
struct QcLookupsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var includeInactive = false
    @State private var form: LookupFormTarget?
    @State private var reloadToken = UUID()

    private var canManage: Bool { container.session.can("settings.manage") }

    var body: some View {
        List {
            LookupSection(kind: "grades", title: i18n.t("qc.grades"),
                          includeInactive: includeInactive, canManage: canManage,
                          reloadToken: reloadToken,
                          onAdd: { form = LookupFormTarget(kind: "grades", existing: nil) },
                          onEdit: { form = LookupFormTarget(kind: "grades", existing: $0) })
            LookupSection(kind: "defect-types", title: i18n.t("qc.defectTypes"),
                          includeInactive: includeInactive, canManage: canManage,
                          reloadToken: reloadToken,
                          onAdd: { form = LookupFormTarget(kind: "defect-types", existing: nil) },
                          onEdit: { form = LookupFormTarget(kind: "defect-types", existing: $0) })
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .listRowBackground(Tokens.surface)
        .background(Tokens.bg)
        .navigationTitle(i18n.t("qc.tabLookups", default: "Ma'lumotnomalar"))
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Toggle(i18n.t("qc.showInactive", default: "Show Inactive"), isOn: $includeInactive)
                } label: {
                    Image(systemName: includeInactive ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                }
            }
        }
        .sheet(item: $form, onDismiss: { reloadToken = UUID() }) { target in
            LookupFormSheet(kind: target.kind, existing: target.existing)
        }
    }
}

/// Identifies which lookup form to present (add vs edit, grades vs defects).
struct LookupFormTarget: Identifiable {
    let id = UUID()
    let kind: String
    let existing: Lookup?
}

private struct LookupSection: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    let kind: String
    let title: String
    let includeInactive: Bool
    let canManage: Bool
    let reloadToken: UUID
    let onAdd: () -> Void
    let onEdit: (Lookup) -> Void

    @State private var store: AsyncStore<[Lookup]>?

    var body: some View {
        Section {
            if let store {
                LoadableView(state: store.state, retry: reload) { rows in
                    if rows.isEmpty {
                        Text(i18n.t("common.notFound")).foregroundStyle(.secondary)
                    } else {
                        ForEach(rows) { row in LookupRow(row: row, canManage: canManage) { onEdit(row) } }
                    }
                }
            } else {
                LoadingView()
            }
        } header: {
            HStack {
                Text(title)
                Spacer()
                if canManage {
                    Button(action: onAdd) { Label(i18n.t("common.add"), systemImage: "plus") }
                        .font(.caption)
                }
            }
        }
        .task(id: reloadIdentity) {
            store = makeStore()
            await store?.reload()
        }
    }

    private var reloadIdentity: String { "\(includeInactive)-\(reloadToken)" }

    private func makeStore() -> AsyncStore<[Lookup]> {
        let repo = QcRepository(api: container.api)
        let kind = kind, inactive = includeInactive
        return AsyncStore { try await repo.listLookups(kind, includeInactive: inactive) }
    }

    private func reload() { Task { await store?.reload() } }
}

private struct LookupRow: View {
    @Environment(I18n.self) private var i18n
    let row: Lookup
    let canManage: Bool
    let onTap: () -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 3) {
                Text(row.label)
                    .font(.body.weight(.medium))
                    .foregroundStyle(Tokens.ink)
                Text(row.code)
                    .font(.mono(12))
                    .foregroundStyle(.secondary)
            }
            Spacer()
            if !row.isActive {
                StatusBadge(i18n.t("common.no", default: "Inactive"), color: Tokens.ash)
            } else if canManage {
                Image(systemName: "chevron.right").font(.caption).foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 3)
        .contentShape(Rectangle())
        .onTapGesture { if canManage { onTap() } }
    }
}
