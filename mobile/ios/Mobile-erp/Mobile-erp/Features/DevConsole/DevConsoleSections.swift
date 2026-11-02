import SwiftUI

/// One entry in the developer console. Adding a future setting is one new view
/// file plus one line in `DevConsoleSections.all` — nothing else changes.
struct DevConsoleSection: Identifiable {
    let id: String
    let title: String
    let systemImage: String
    let view: () -> AnyView
}

/// THE developer-console registry. Order here is the display order.
enum DevConsoleSections {
    static let all: [DevConsoleSection] = [
        DevConsoleSection(id: "environment", title: "Environment", systemImage: "server.rack",
                          view: { AnyView(DevEnvironmentView()) }),
        DevConsoleSection(id: "network", title: "Network", systemImage: "network",
                          view: { AnyView(DevNetworkView()) }),
        DevConsoleSection(id: "logs", title: "Logs", systemImage: "doc.text.magnifyingglass",
                          view: { AnyView(DevLogsView()) }),
    ]
}
