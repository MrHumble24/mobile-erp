import SwiftUI

/// Customs price lists (ADR 0027): the current list with each code's previous
/// fee and a change marker, every version, and the models that have no fee.
/// Reads need `customs.read`; "New price list" needs `customs.manage`.
/// Online-only — a failure shows a retry.
struct CustomsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var model: CustomsModel?
    @State private var tab: CustomsTab = .current
    @State private var showNewList = false

    private var canManage: Bool { container.session.can("customs.manage") }

    var body: some View {
        VStack(spacing: 0) {
            SegmentedControl(selection: $tab, segments: CustomsTab.allCases.map { ($0, i18n.t($0.labelKey)) })
                .padding(.horizontal, Tokens.Space.gutter)
                .padding(.vertical, Tokens.Space.md)
            content
        }
        .background(Tokens.ground)
        .navigationTitle(i18n.t("nav.customs"))
        .toolbar {
            if canManage {
                ToolbarItem(placement: .primaryAction) {
                    Button { showNewList = true } label: {
                        Label(i18n.t("customs.newList"), systemImage: "plus")
                    }
                }
            }
        }
        .task {
            if model == nil { model = CustomsModel(api: container.api) }
            if model?.loaded == false { await model?.load() }
            #if DEBUG
            // Screenshot helpers: `-openCustomsTab current|versions|unmatched`,
            // `-openCustomsNew 1` opens the new-list sheet.
            if let raw = KitDebugLaunch.consume("openCustomsTab"), let t = CustomsTab(rawValue: raw) { tab = t }
            if KitDebugLaunch.consume("openCustomsNew") == "1", canManage { showNewList = true }
            #endif
        }
        .sheet(isPresented: $showNewList, onDismiss: { Task { await model?.load() } }) {
            CustomsNewListSheet(current: model?.current)
        }
    }

    @ViewBuilder private var content: some View {
        if let model {
            if let error = model.error, !model.loaded {
                ErrorStateView(message: error, retry: { Task { await model.load() } })
            } else if model.loading, !model.loaded {
                LoadingView()
            } else {
                ScrollView {
                    VStack(spacing: Tokens.Space.md) {
                        switch tab {
                        case .current: currentSection(model)
                        case .versions: versionsSection(model)
                        case .unmatched: unmatchedSection(model)
                        }
                    }
                    .padding(.horizontal, Tokens.Space.gutter)
                    .padding(.bottom, Tokens.Space.gutter)
                }
                .refreshable { await model.load() }
            }
        } else {
            LoadingView()
        }
    }

    @ViewBuilder private func currentSection(_ model: CustomsModel) -> some View {
        if let list = model.current {
            VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                Text(i18n.t("customs.effectiveAt") + ": " + KitDate.day(list.effectiveAt))
                    .font(.ui(.caption)).foregroundStyle(Tokens.muted)
                if let note = list.note, !note.isEmpty {
                    Text(note).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            ForEach(list.items) { CustomsCurrentRow(item: $0) }
        } else {
            EmptyStateView(systemImage: "doc.text", title: i18n.t("customs.emptyList"))
        }
    }

    @ViewBuilder private func versionsSection(_ model: CustomsModel) -> some View {
        if model.versions.isEmpty {
            EmptyStateView(systemImage: "clock", title: i18n.t("customs.emptyList"))
        } else {
            ForEach(model.versions) { CustomsVersionRow(version: $0) }
        }
    }

    @ViewBuilder private func unmatchedSection(_ model: CustomsModel) -> some View {
        if model.unmatched.isEmpty {
            EmptyStateView(systemImage: "checkmark.circle", title: i18n.t("customs.unmatchedEmpty"))
        } else {
            ForEach(model.unmatched) { CustomsUnmatchedRow(model: $0) }
        }
    }
}

/// The three customs sections, in display order.
enum CustomsTab: String, CaseIterable, Identifiable {
    case current, versions, unmatched
    var id: String { rawValue }
    var labelKey: String {
        switch self {
        case .current: "customs.currentList"
        case .versions: "customs.versions"
        case .unmatched: "customs.unmatchedTitle"
        }
    }
}
