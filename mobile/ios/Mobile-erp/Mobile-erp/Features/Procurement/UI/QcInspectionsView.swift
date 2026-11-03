import SwiftUI

/// Past inspections, newest first, with a pass/fail filter and load-more paging.
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
        VStack(spacing: 0) {
            if filter != .all {
                HStack(spacing: 8) {
                    Text(i18n.t(filter == .passed ? "qc.passed" : "qc.failed"))
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(filter == .passed ? Tokens.success : Tokens.danger)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(
                            (filter == .passed ? Tokens.success : Tokens.danger).opacity(0.12),
                            in: Capsule()
                        )
                    Spacer()
                    Button(i18n.t("common.reset", default: "Tozalash")) {
                        filter = .all
                    }
                    .font(.caption.weight(.medium))
                    .foregroundStyle(Tokens.signalBlue)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color(.secondarySystemGroupedBackground))
            }

            content
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle(i18n.t("qc.tabInspections", default: "Tekshiruvlar"))
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showFilterSheet = true
                } label: {
                    Image(systemName: filter == .all ? "line.3.horizontal.decrease.circle" : "line.3.horizontal.decrease.circle.fill")
                        .foregroundStyle(filter == .all ? .primary : Tokens.signalBlue)
                }
            }
        }
        .sheet(isPresented: $showFilterSheet) {
            QcInspectionsFilterSheet(filter: $filter)
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

/// Bottom sheet for selecting inspection pass/fail filter.
private struct QcInspectionsFilterSheet: View {
    @Binding var filter: QcInspectionsView.PassFilter
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section {
                    filterRow(title: i18n.t("common.all"), target: .all)
                    filterRow(title: i18n.t("qc.passed"), target: .passed)
                    filterRow(title: i18n.t("qc.failed"), target: .failed)
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle(i18n.t("common.filter", default: "Filtrlash"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.done", default: "Tayyor")) { dismiss() }
                }
            }
        }
        .presentationDetents([.height(260)])
    }

    private func filterRow(title: String, target: QcInspectionsView.PassFilter) -> some View {
        Button {
            filter = target
            dismiss()
        } label: {
            HStack {
                Text(title).foregroundStyle(Tokens.ink)
                Spacer()
                if filter == target {
                    Image(systemName: "checkmark").foregroundStyle(Tokens.signalBlue)
                }
            }
        }
    }
}
