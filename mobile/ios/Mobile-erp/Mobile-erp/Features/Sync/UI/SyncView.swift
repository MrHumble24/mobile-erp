import SwiftUI

/// Sync status screen: connectivity + manual "sync now", the live offline
/// outbox queue, and (for a `sync.resolve` user) the server conflict inbox with
/// keep-server / apply-terminal. Visible to every signed-in user.
struct SyncView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = SyncModel()

    var body: some View {
        List {
            statusSection
            queueSection
            if model.can("sync.resolve") { conflictsSection }
        }
        .navigationTitle(i18n.t("nav.sync", default: "Sync"))
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            model.refreshQueue()
            await model.loadConflicts()
        }
        .task {
            model.bind(container)
            model.refreshQueue()
            await model.loadConflicts()
        }
    }

    private var statusSection: some View {
        Section {
            HStack(spacing: 12) {
                SyncStatusChip(online: model.isOnline,
                               label: i18n.t(model.isOnline ? "common.online" : "common.offline",
                                             default: model.isOnline ? "Online" : "Offline"))
                Spacer()
                Button {
                    Task { await model.syncNow() }
                } label: {
                    Label(i18n.t("common.syncNow", default: "Sync now"), systemImage: "arrow.triangle.2.circlepath")
                }
                .buttonStyle(.borderedProminent)
                .disabled(!model.isOnline)
            }
            if let err = model.actionError {
                Label(err, systemImage: "exclamationmark.triangle")
                    .font(.footnote).foregroundStyle(Tokens.danger)
            }
        }
    }

    private var queueSection: some View {
        Section(i18n.t("common.syncQueue", default: "Offline queue")) {
            if model.queue.isEmpty {
                Text(i18n.t("common.noQueue", default: "Nothing waiting to sync."))
                    .font(.footnote).foregroundStyle(.secondary)
            } else {
                ForEach(model.queue, id: \.id) { QueueRowView(entry: $0) }
            }
        }
    }

    private var conflictsSection: some View {
        Section(i18n.t("common.conflicts", default: "Conflicts")) {
            if model.conflictsLoading {
                ProgressView()
            } else if let err = model.conflictError {
                Text(err).font(.footnote).foregroundStyle(Tokens.danger)
            } else if model.conflicts.isEmpty {
                Label(i18n.t("common.noConflicts", default: "No conflicts."),
                      systemImage: "checkmark.circle")
                    .font(.footnote).foregroundStyle(.secondary)
            } else {
                ForEach(model.conflicts) { row in
                    ConflictRowView(row: row, disabled: !model.isOnline) { resolution in
                        Task { await model.resolve(id: row.id, resolution: resolution) }
                    }
                }
            }
        }
    }
}

/// Queue entry: mutation type, its status pill, and the last error if any.
private struct QueueRowView: View {
    @Environment(I18n.self) private var i18n
    let entry: OutboxEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(entry.type).font(.mono(14, weight: .medium))
                Spacer()
                StatusBadge(statusLabel, color: statusColor)
            }
            if let error = entry.lastError, !error.isEmpty {
                Text(error).font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 2)
    }

    private var statusLabel: String {
        switch entry.status {
        case "conflict": return i18n.t("common.statusConflict", default: "Conflict")
        case "rejected": return i18n.t("common.statusRejected", default: "Rejected")
        default: return i18n.t("common.statusPending", default: "Pending")
        }
    }

    private var statusColor: Color {
        switch entry.status {
        case "conflict": return Tokens.warning
        case "rejected": return Tokens.danger
        default: return Tokens.ash
        }
    }
}

/// Conflict row: imei + attempted mutation, with keep-server / apply-terminal.
private struct ConflictRowView: View {
    @Environment(I18n.self) private var i18n
    let row: ConflictRow
    let disabled: Bool
    let onResolve: (String) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(row.type).font(.subheadline.weight(.semibold))
            Text(row.imei).font(.mono(13)).foregroundStyle(.secondary)
            HStack {
                Button(i18n.t("common.keepServer", default: "Keep server")) {
                    onResolve("keep-server")
                }
                .buttonStyle(.bordered)
                Button(i18n.t("common.applyTerminal", default: "Apply mine")) {
                    onResolve("apply-terminal")
                }
                .buttonStyle(.borderedProminent)
            }
            .disabled(disabled)
        }
        .padding(.vertical, 4)
    }
}

/// Connectivity chip. A faint glass treatment on iOS 26+, a material fill below.
private struct SyncStatusChip: View {
    let online: Bool
    let label: String

    var body: some View {
        let color = online ? Tokens.success : Tokens.ash
        Label(label, systemImage: online ? "cloud.fill" : "cloud.slash")
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .modifier(ChipBackground())
    }
}

private struct ChipBackground: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 26, *) {
            content.glassEffect(.regular, in: .capsule)
        } else {
            content.background(.thinMaterial, in: Capsule())
        }
    }
}
