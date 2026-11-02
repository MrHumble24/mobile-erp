import SwiftUI

/// Logs section: app log lines newest first, with a level filter, search, clear,
/// and share-all. Fed by the `AppLog` ring buffer.
struct DevLogsView: View {
    private let log = AppLog.shared
    @State private var search = ""
    @State private var level: AppLogLevel?

    private var rows: [AppLogEntry] {
        log.entries.reversed().filter { e in
            (level == nil || e.level == level)
                && (search.isEmpty
                    || e.message.localizedCaseInsensitiveContains(search)
                    || e.tag.localizedCaseInsensitiveContains(search))
        }
    }

    var body: some View {
        List {
            Picker("Level", selection: $level) {
                Text("All").tag(AppLogLevel?.none)
                ForEach(AppLogLevel.allCases) { Text($0.label).tag(AppLogLevel?.some($0)) }
            }
            .pickerStyle(.segmented)
            .listRowInsets(EdgeInsets(top: 6, leading: 12, bottom: 6, trailing: 12))

            if rows.isEmpty {
                Text("No log lines.").foregroundStyle(.secondary)
            }
            ForEach(rows) { row($0) }
        }
        .searchable(text: $search, prompt: "Message or tag")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    ShareLink("Share all", item: DevConsoleFormat.logText(log.entries))
                    Button("Clear", role: .destructive) { log.clear() }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
    }

    private func row(_ e: AppLogEntry) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                DevCapsule(text: e.level.label, color: e.level.color)
                Text(e.tag).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                Spacer()
                Text(DevTime.string(e.date)).font(.caption2).foregroundStyle(.secondary)
            }
            Text(e.message).font(.callout)
        }
    }
}
