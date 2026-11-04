import SwiftUI

/// Alerts tab: the models currently under their minimum (danger count pill),
/// then the alert rules as cards; the one orange is "Yangi qoida". Rule writes
/// need `settings.manage`; reads need `device.read` (the section gate). Same
/// anatomy as the Android `StockAlertsTab`.
struct StockAlertsTab: View {
    let store: InventoryStore
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var rules: [StockAlertRuleView] = []
    @State private var loading = true
    @State private var editing: RuleTarget?

    private var canManage: Bool { container.session.can("settings.manage") }
    private var repo: StockAlertRepository { StockAlertRepository(container) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                if !store.lowStock.isEmpty {
                    heading(i18n.t("inventory.lowStock"))
                    ForEach(store.lowStock) { row in
                        AppCard {
                            HStack(spacing: Tokens.Space.sm) {
                                modelLine(store.modelLabel(row.modelId), row.storage)
                                Spacer(minLength: Tokens.Space.sm)
                                StatusBadge("\(row.currentCount) / \(row.threshold)",
                                            color: row.isBelow ? Tokens.danger : Tokens.success)
                            }
                        }
                    }
                }
                HStack {
                    heading(i18n.t("inventory.rulesTitle"))
                    Spacer()
                    if canManage {
                        Button(i18n.t("inventory.newRule")) { editing = RuleTarget(rule: nil) }
                            .buttonStyle(.pillPrimary)
                    }
                }
                if loading {
                    AppCard { LoadingView().frame(height: 120) }
                } else if rules.isEmpty {
                    AppCard {
                        EmptyStateView(systemImage: "bell.slash", title: i18n.t("common.notFound"))
                    }
                } else {
                    ForEach(rules) { rule in ruleRow(rule) }
                }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.bottom, Tokens.Space.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Tokens.ground)
        .appSheet(item: $editing) { target in
            AlertRuleForm(rule: target.rule, store: store, onSaved: { await reload() })
        }
        .task { await reload() }
        #if DEBUG
        // Screenshot helper: `-openRule new` opens the form.
        .onAppear {
            if editing == nil, KitDebugLaunch.consume("openRule") == "new" {
                editing = RuleTarget(rule: nil)
            }
        }
        #endif
    }

    private func heading(_ text: String) -> some View {
        Text(text).font(.ui(.heading)).foregroundStyle(Tokens.text)
    }

    private func modelLine(_ name: String, _ storage: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(name).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
            Text(storage).font(.data(.regular)).foregroundStyle(Tokens.muted)
        }
    }

    /// Model + storage left; the minimum threshold in mono right, labelled once.
    @ViewBuilder private func ruleRow(_ rule: StockAlertRuleView) -> some View {
        let card = AppCard {
            HStack(spacing: Tokens.Space.sm) {
                modelLine(store.modelLabel(rule.modelId), rule.storage)
                Spacer(minLength: Tokens.Space.sm)
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(rule.threshold)").font(.mono(17, weight: .semibold)).foregroundStyle(Tokens.text)
                    Text(i18n.t("inventory.threshold")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
            }
        }
        if canManage {
            Button { editing = RuleTarget(rule: rule) } label: { card }.buttonStyle(.plain)
        } else {
            card
        }
    }

    private func reload() async {
        rules = (try? await repo.list()) ?? rules
        loading = false
        await store.loadLowStock()
    }
}

private struct RuleTarget: Identifiable {
    let rule: StockAlertRuleView?
    var id: String { rule?.id ?? "new" }
}
