import SwiftUI

/// Past inspections, newest first. Read-only list.
struct QcInspectionsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    let refresh: UUID
    @State private var store: AsyncStore<[QcInspection]>?

    var body: some View {
        Group {
            if let store {
                LoadableView(state: store.state, retry: { Task { await store.reload() } }) { items in
                    if items.isEmpty {
                        EmptyStateView(systemImage: "doc.text.magnifyingglass", title: i18n.t("qc.queueEmpty"))
                    } else {
                        List {
                            ForEach(items) { item in InspectionRow(item: item) }
                        }
                        .listStyle(.insetGrouped)
                    }
                }
            } else {
                LoadingView()
            }
        }
        .task(id: refresh) {
            if store == nil {
                let repo = QcRepository(api: ProcApi(container))
                store = AsyncStore { try await repo.listInspections(passed: nil).items }
            }
            await store?.reload()
        }
    }
}

private struct InspectionRow: View {
    @Environment(I18n.self) private var i18n
    let item: QcInspection

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(item.imei).font(.mono(13))
                Text(subtitle).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            StatusBadge(
                i18n.t(item.passed ? "qc.passed" : "qc.failed"),
                color: item.passed ? Tokens.success : Tokens.danger
            )
        }
    }

    private var subtitle: String {
        [item.modelLabel,
         item.gradeCode.map { "\(i18n.t("qc.grade")): \($0)" },
         item.inspectorName]
            .compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · ")
    }
}
