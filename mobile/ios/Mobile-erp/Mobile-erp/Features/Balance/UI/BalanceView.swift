import SwiftUI

/// Store Balance: one card per money account with its balance, the total, then
/// the paged history (newest first) with account/type/date filters. Manual
/// entries (`balance.manage`) open from the "+" menu. Online-only — the screen
/// shows the offline banner and every write refuses while offline.
struct BalanceView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = BalanceModel()
    @State private var showFilters = false
    @State private var entryKind: BalanceEntryKind?
    @State private var showTransfer = false

    private var canManage: Bool { container.session.can("balance.manage") }
    private var items: [BalanceTransaction] { model.pager?.items ?? [] }
    private var hasActiveFilters: Bool {
        model.accountCode != nil || model.typeCode != nil || model.range != .all
    }

    var body: some View {
        @Bindable var model = model
        ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                if !container.connectivity.isOnline {
                    OfflineBanner(message: i18n.t("common.offline", default: "Offline"))
                }
                accounts
                Text(i18n.t("balance.history"))
                    .font(.ui(.heading)).foregroundStyle(Tokens.text)
                    .frame(maxWidth: .infinity, alignment: .leading)
                listBody
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.bottom, Tokens.Space.lg)
        }
        .refreshable { await model.reload() }
        .background(Tokens.ground)
        .navigationTitle(i18n.t("balance.title"))
        .toolbar { toolbar }
        .sheet(isPresented: $showFilters) { BalanceFiltersSheet(model: model) }
        .sheet(item: $entryKind) { kind in
            BalanceEntrySheet(model: model, kind: kind, accounts: model.accounts) { toast($0) }
        }
        .sheet(isPresented: $showTransfer) {
            BalanceTransferSheet(model: model, accounts: model.accounts) { toast($0) }
        }
        .task {
            model.bind(container)
            if model.summary == nil { await model.load() }
            #if DEBUG
            BalanceSelfCheck.run()
            // Screenshot helper: `-openBalanceEntry opening|deposit|withdraw|correction|transfer`.
            if entryKind == nil, !showTransfer,
               let raw = KitDebugLaunch.consume("openBalanceEntry", accept: {
                   BalanceEntryKind(rawValue: $0) != nil || $0 == "transfer" }) {
                if raw == "transfer" { showTransfer = true } else { entryKind = BalanceEntryKind(rawValue: raw) }
            }
            #endif
        }
    }

    // MARK: accounts + total

    @ViewBuilder private var accounts: some View {
        if let summary = model.summary {
            ForEach(summary.accounts) { account in
                accountCard(label: BalanceFormat.account(account.accountCode, label: account.label, i18n),
                            value: account.balance, total: false)
            }
            accountCard(label: i18n.t("balance.total"), value: summary.total, total: true)
        } else {
            AppCard { LoadingView().frame(height: 100) }
        }
    }

    private func accountCard(label: String, value: String, total: Bool) -> some View {
        let negative = (Decimal(string: value) ?? 0) < 0
        return AppCard {
            HStack(alignment: .center, spacing: Tokens.Space.sm) {
                VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                    Text(label)
                        .font(total ? .ui(.heading) : .ui(.bodyStrong))
                        .foregroundStyle(total ? Tokens.text : Tokens.muted)
                    if negative {
                        StatusBadge(i18n.t("balance.belowZero"), color: Tokens.danger)
                    }
                }
                Spacer(minLength: Tokens.Space.sm)
                MoneyText(value: value, size: 24)
                    .fontWeight(.medium)
                    .foregroundStyle(BalanceFormat.balanceTint(value))
            }
        }
    }

    // MARK: history list

    @ViewBuilder private var listBody: some View {
        if let error = model.pager?.error, items.isEmpty {
            AppCard { ErrorStateView(message: error) { Task { await model.reload() } } }
        } else if items.isEmpty {
            if model.pager?.isLoading ?? true {
                AppCard { LoadingView().frame(height: 120) }
            } else {
                AppCard { EmptyStateView(systemImage: "banknote", title: i18n.t("balance.emptyHistory")) }
            }
        } else {
            ForEach(items) { tx in BalanceHistoryRow(tx: tx) }
            if let pager = model.pager { KitLoadMoreFooter(pager: pager) }
        }
    }

    // MARK: toolbar

    @ToolbarContentBuilder private var toolbar: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Button { Haptic.tick.play(); showFilters = true } label: {
                Label(i18n.t("common.filter"),
                      systemImage: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
            }
        }
        if canManage {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    Button(i18n.t("balance.setOpening")) { entryKind = .opening }
                    Button(i18n.t("balance.deposit")) { entryKind = .deposit }
                    Button(i18n.t("balance.withdraw")) { entryKind = .withdraw }
                    Button(i18n.t("balance.correction")) { entryKind = .correction }
                    Button(i18n.t("balance.transfer")) { showTransfer = true }
                } label: {
                    Label(i18n.t("balance.newEntry"), systemImage: "plus")
                }
            }
        }
    }

    private func toast(_ message: String) { container.toasts.info(message) }
}
