import SwiftUI

/// Full detail for one captured request: a Request / Response / Headers segment,
/// pretty-printed JSON in mono, copy, and ShareLink (plain text and as cURL).
struct DevNetworkDetailView: View {
    let entry: NetLogEntry
    @State private var tab: Tab = .request

    enum Tab: String, CaseIterable, Identifiable {
        case request = "Request", response = "Response", headers = "Headers"
        var id: String { rawValue }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            summary
            Picker("View", selection: $tab) {
                ForEach(Tab.allCases) { Text($0.rawValue).tag($0) }
            }
            .pickerStyle(.segmented)
            ScrollView { DevMonoBlock(text: body(for: tab)) }
            Spacer()
        }
        .padding()
        .navigationTitle("\(entry.method)")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button { UIPasteboard.general.string = body(for: tab) } label: {
                        Label("Copy \(tab.rawValue)", systemImage: "doc.on.doc")
                    }
                    Button { UIPasteboard.general.string = DevConsoleFormat.curl(entry) } label: {
                        Label("Copy as cURL", systemImage: "terminal")
                    }
                    ShareLink("Share text", item: DevConsoleFormat.networkText(entry))
                    ShareLink("Share as cURL", item: DevConsoleFormat.curl(entry))
                } label: {
                    Image(systemName: "square.and.arrow.up")
                }
            }
        }
    }

    private var summary: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(entry.url).font(.mono(12)).textSelection(.enabled)
            HStack(spacing: 10) {
                DevCapsule(text: entry.status.map(String.init) ?? "FAILED", color: entry.outcome.color)
                Text(entry.durationMs.map { "\($0) ms" } ?? "—")
                Text(DevTime.string(entry.start))
            }
            .font(.caption).foregroundStyle(Tokens.muted)
            if let error = entry.error {
                Text(error).font(.caption).foregroundStyle(Tokens.danger)
            }
        }
    }

    private func body(for tab: Tab) -> String {
        switch tab {
        case .request: return DevConsoleFormat.prettyJSON(entry.requestBody)
        case .response: return DevConsoleFormat.prettyJSON(entry.responseBody)
        case .headers:
            return "— Request —\n" + DevConsoleFormat.headerLines(entry.requestHeaders)
                + "\n\n— Response —\n" + DevConsoleFormat.headerLines(entry.responseHeaders)
        }
    }
}
