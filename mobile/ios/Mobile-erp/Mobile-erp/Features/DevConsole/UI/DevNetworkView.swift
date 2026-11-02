import SwiftUI

/// Network section: every captured HTTP call, newest first, with search and a
/// status-class filter. Tap a row for the full request/response detail.
struct DevNetworkView: View {
    private let store = NetLogStore.shared
    @State private var search = ""
    @State private var filter: NetLogEntry.Outcome?

    private var rows: [NetLogEntry] {
        store.entries.reversed().filter { e in
            (filter == nil || e.outcome == filter)
                && (search.isEmpty || e.url.localizedCaseInsensitiveContains(search)
                    || e.method.localizedCaseInsensitiveContains(search))
        }
    }

    var body: some View {
        List {
            filterRow
            if rows.isEmpty {
                Text("No requests captured.").foregroundStyle(.secondary)
            }
            ForEach(rows) { entry in
                NavigationLink { DevNetworkDetailView(entry: entry) } label: { row(entry) }
            }
        }
        .searchable(text: $search, prompt: "URL or method")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Clear", role: .destructive) { store.clear() }
                    .disabled(store.entries.isEmpty)
            }
        }
    }

    private var filterRow: some View {
        Picker("Status", selection: $filter) {
            Text("All").tag(NetLogEntry.Outcome?.none)
            ForEach(NetLogEntry.Outcome.allCases) { Text($0.title).tag(NetLogEntry.Outcome?.some($0)) }
        }
        .pickerStyle(.segmented)
        .listRowInsets(EdgeInsets(top: 6, leading: 12, bottom: 6, trailing: 12))
    }

    private func row(_ e: NetLogEntry) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(e.method).font(.caption.weight(.bold)).monospaced()
                DevCapsule(text: e.status.map(String.init) ?? "FAIL", color: e.outcome.color)
                Spacer()
                Text(e.durationMs.map { "\($0) ms" } ?? "—")
                    .font(.caption2).foregroundStyle(.secondary)
            }
            Text(path(e.url)).font(.mono(12)).lineLimit(1).truncationMode(.middle)
            Text(DevTime.string(e.start)).font(.caption2).foregroundStyle(.secondary)
        }
    }

    private func path(_ url: String) -> String {
        guard let comps = URLComponents(string: url) else { return url }
        return comps.path + (comps.query.map { "?\($0)" } ?? "")
    }
}
