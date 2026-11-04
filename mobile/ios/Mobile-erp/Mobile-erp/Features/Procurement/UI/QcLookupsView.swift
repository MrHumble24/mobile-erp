import SwiftUI

/// Manage QC grades and defect types (ADR 0014): two card sections of rows
/// (label, mono code, sold-grey pill when inactive), each with a secondary add
/// pill; tap a row to edit. Writes need `settings.manage`. The active-only /
/// all switch is an inline segmented control.
struct QcLookupsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var includeInactive = false
    @State private var form: LookupFormTarget?
    @State private var reloadToken = UUID()

    private var canManage: Bool { container.session.can("settings.manage") }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SegmentedControl(selection: $includeInactive, segments: [
                    (false, i18n.t("qc.active")),
                    (true, i18n.t("common.all")),
                ])
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
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.vertical, Tokens.Space.md)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Tokens.ground)
        .navigationTitle(i18n.t("qc.tabLookups"))
        .navigationBarTitleDisplayMode(.inline)
        .appSheet(item: $form, onDismiss: { reloadToken = UUID() }) { target in
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
        VStack(alignment: .leading, spacing: Tokens.Space.md) {
            HStack {
                Text(title).font(.ui(.heading)).foregroundStyle(Tokens.text)
                Spacer()
                if canManage {
                    Button(i18n.t("common.add"), action: onAdd).buttonStyle(.pillSecondary)
                }
            }
            AppCard(padding: 0) {
                if let store {
                    LoadableView(state: store.state, retry: reload) { rows in
                        if rows.isEmpty {
                            Text(i18n.t("common.notFound")).font(.ui(.body)).foregroundStyle(Tokens.muted)
                                .padding(Tokens.Space.cardPad)
                        } else {
                            VStack(spacing: 0) {
                                ForEach(Array(rows.enumerated()), id: \.element.id) { i, row in
                                    LookupRow(row: row, canManage: canManage) { onEdit(row) }
                                    if i < rows.count - 1 { Divider().overlay(Tokens.border).padding(.horizontal, Tokens.Space.cardPad) }
                                }
                            }
                        }
                    }
                } else {
                    LoadingView().frame(height: 80)
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
        Button(action: { if canManage { onTap() } }) {
            HStack(spacing: Tokens.Space.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(row.label).font(.ui(.body)).foregroundStyle(Tokens.text)
                    Text(row.code).font(.data(.regular)).foregroundStyle(Tokens.muted)
                }
                Spacer(minLength: Tokens.Space.sm)
                if !row.isActive {
                    StatusBadge(i18n.t("common.no"), color: Tokens.sold)
                } else if canManage {
                    Image(systemName: "chevron.right").font(.system(size: 13, weight: .semibold)).foregroundStyle(Tokens.muted)
                }
            }
            .frame(minHeight: Tokens.Space.minTouch)
            .padding(.horizontal, Tokens.Space.cardPad)
            .padding(.vertical, Tokens.Space.sm)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}
