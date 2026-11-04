import SwiftUI

/// Past inspections, newest first, as white cards with a result pill; the
/// pass/fail filter lives in a kit `FilterSheet` behind a ghost pill. Load-more
/// paging.
struct QcInspectionsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    let refresh: UUID
    @State private var filter: PassFilter = .all
    @State private var pager: KitPaginator<QcInspection>?
    @State private var showFilterSheet = false

    fileprivate enum PassFilter: Hashable {
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
        ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                HStack {
                    Spacer()
                    Button {
                        showFilterSheet = true
                    } label: {
                        Label(
                            filter == .all ? i18n.t("common.filter") : i18n.t(filter == .passed ? "qc.passed" : "qc.failed"),
                            systemImage: filter == .all ? "line.3.horizontal.decrease.circle" : "line.3.horizontal.decrease.circle.fill"
                        )
                    }
                    .buttonStyle(.pillGhost)
                }
                content
            }
            .padding(.bottom, Tokens.Space.lg)
        }
        .sheet(isPresented: $showFilterSheet) {
            FilterSheet(
                title: i18n.t("common.filter"),
                resetLabel: i18n.t("inventory.clearFilters"),
                closeLabel: i18n.t("common.close"),
                onReset: { filter = .all },
                onClose: { showFilterSheet = false }
            ) {
                SegmentedControl(selection: $filter, segments: [
                    (.all, i18n.t("common.all")),
                    (.passed, i18n.t("qc.passed")),
                    (.failed, i18n.t("qc.failed")),
                ])
            }
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
                AppCard { ErrorStateView(message: error, retry: { Task { await pager.first() } }) }
            } else if pager.items.isEmpty, !pager.isLoading {
                AppCard { EmptyStateView(systemImage: "doc.text.magnifyingglass", title: i18n.t("common.notFound")) }
            } else {
                ForEach(pager.items) { item in InspectionRow(item: item) }
                KitLoadMoreFooter(pager: pager)
            }
        } else {
            AppCard { LoadingView().frame(height: 120) }
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

/// Model + mono IMEI, then grade · inspector · time; the result pill right.
private struct InspectionRow: View {
    @Environment(I18n.self) private var i18n
    let item: QcInspection

    var body: some View {
        AppCard {
            HStack(spacing: Tokens.Space.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(item.modelLabel.isEmpty ? item.imei : item.modelLabel).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                    Text(item.imei).font(.data(.regular)).foregroundStyle(Tokens.text)
                    Text(meta).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                Spacer(minLength: Tokens.Space.sm)
                HStack(spacing: Tokens.Space.xs) {
                    if let grade = item.gradeCode { StatusBadge(grade, color: Tokens.sold) }
                    StatusBadge(i18n.t(item.passed ? "qc.passed" : "qc.failed"),
                                color: item.passed ? Tokens.success : Tokens.danger)
                }
            }
        }
    }

    private var meta: String {
        [item.inspectorName.isEmpty ? nil : item.inspectorName,
         KitDate.dayTime(item.inspectedAt)]
            .compactMap { $0 }.joined(separator: " · ")
    }
}
