import SwiftUI

/// Past inspections, newest first, with a pass/fail filter and load-more paging.
struct QcInspectionsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    let refresh: UUID
    @State private var filter: PassFilter = .all
    @State private var pager: KitPaginator<QcInspection>?

    private enum PassFilter: Hashable {
        case all, passed, failed
        var passed: Bool? {
            switch self {
            case .all: return nil
            case .passed: return true
            case .failed: return false
            }
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            Picker("", selection: $filter) {
                Text(i18n.t("common.all")).tag(PassFilter.all)
                Text(i18n.t("qc.passed")).tag(PassFilter.passed)
                Text(i18n.t("qc.failed")).tag(PassFilter.failed)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)

            content
        }
        .task(id: refresh) {
            if pager == nil { pager = makePager() }
            await pager?.first()
        }
        .onChange(of: filter) {
            pager = makePager()
            Task { await pager?.first() }
        }
    }

    @ViewBuilder
    private var content: some View {
        if let pager {
            if let error = pager.error, pager.items.isEmpty {
                ErrorStateView(message: error, retry: { Task { await pager.first() } })
            } else if pager.items.isEmpty, !pager.isLoading {
                EmptyStateView(systemImage: "doc.text.magnifyingglass", title: i18n.t("qc.queueEmpty"))
            } else {
                List {
                    ForEach(pager.items) { item in InspectionRow(item: item) }
                    KitLoadMoreFooter(pager: pager)
                }
                .listStyle(.insetGrouped)
            }
        } else {
            LoadingView()
        }
    }

    private func makePager() -> KitPaginator<QcInspection> {
        let repo = QcRepository(api: container.api)
        let passed = filter.passed
        return KitPaginator { page, size in
            let r = try await repo.listInspections(passed: passed, page: page, pageSize: size)
            return (r.items, r.total)
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
