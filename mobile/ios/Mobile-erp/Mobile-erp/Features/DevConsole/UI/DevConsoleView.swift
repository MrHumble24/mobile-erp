import SwiftUI

/// The developer console root. iPad: a `NavigationSplitView` (sections | content).
/// iPhone: a `NavigationStack` list that pushes each section. Sections come from
/// the `DevConsoleSections` registry, so this view never changes when one is added.
struct DevConsoleView: View {
    @State private var selected: String? = DevConsoleSections.all.first?.id

    private var sections: [DevConsoleSection] { DevConsoleSections.all }

    var body: some View {
        if UIDevice.current.userInterfaceIdiom == .pad {
            splitView
        } else {
            stackView
        }
    }

    private var splitView: some View {
        NavigationSplitView {
            List(selection: $selected) {
                ForEach(sections) { section in
                    Label(section.title, systemImage: section.systemImage).tag(section.id)
                }
            }
            .navigationTitle("Developer")
        } detail: {
            NavigationStack {
                if let section = sections.first(where: { $0.id == selected }) {
                    section.view()
                        .navigationTitle(section.title)
                        .navigationBarTitleDisplayMode(.inline)
                } else {
                    ContentUnavailableView("Select a section", systemImage: "hammer")
                }
            }
        }
    }

    private var stackView: some View {
        List(sections) { section in
            NavigationLink {
                section.view()
                    .navigationTitle(section.title)
                    .navigationBarTitleDisplayMode(.inline)
            } label: {
                Label(section.title, systemImage: section.systemImage)
            }
        }
        .navigationTitle("Developer")
    }
}
