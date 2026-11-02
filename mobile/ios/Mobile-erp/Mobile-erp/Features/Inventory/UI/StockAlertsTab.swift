import SwiftUI

/// Alerts tab: low-stock list + alert-rule management. Rule writes need
/// `settings.manage`; reads need `device.read` (the section gate).
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
        List {
            if !store.lowStock.isEmpty {
                Section {
                    ForEach(store.lowStock) { row in
                        HStack(alignment: .center) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("\(store.modelLabel(row.modelId)) · \(row.storage)")
                                    .font(.body.weight(.semibold))
                                    .foregroundStyle(Tokens.ink)
                                Text(i18n.t("inventory.lowStockWarning", default: "Below minimum safety threshold"))
                                    .font(.caption)
                                    .foregroundStyle(Tokens.danger)
                            }
                            Spacer()
                            VStack(alignment: .trailing, spacing: 2) {
                                Text("\(row.currentCount) / \(row.threshold)")
                                    .font(.mono(16, weight: .bold))
                                    .foregroundStyle(Tokens.danger)
                                Text(i18n.t("inventory.remainingUnits", default: "units left"))
                                    .font(.system(size: 10, weight: .medium))
                                    .foregroundStyle(Tokens.danger.opacity(0.85))
                            }
                        }
                        .padding(.vertical, 4)
                    }
                } header: {
                    Label(i18n.t("inventory.lowStock"), systemImage: "exclamationmark.triangle.fill")
                        .foregroundStyle(Tokens.danger)
                }
            }
            Section {
                if loading {
                    LoadingView()
                } else if rules.isEmpty {
                    EmptyStateView(systemImage: "bell.slash", title: i18n.t("inventory.empty"))
                } else {
                    ForEach(rules) { rule in
                        ruleRow(rule)
                    }
                }
            } header: {
                Text(i18n.t("inventory.rulesTitle"))
            }
        }
        .listStyle(.insetGrouped)
        .toolbar {
            if canManage {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { editing = RuleTarget(rule: nil) } label: {
                        Label(i18n.t("inventory.newRule"), systemImage: "plus")
                    }
                }
            }
        }
        .sheet(item: $editing) { target in
            AlertRuleForm(rule: target.rule, store: store, onSaved: { await reload() })
        }
        .task { await reload() }
    }

    @ViewBuilder private func ruleRow(_ rule: StockAlertRuleView) -> some View {
        let content = LabeledContent("\(store.modelLabel(rule.modelId)) · \(rule.storage)") {
            Text("\(rule.threshold)").font(.mono(14))
        }
        if canManage {
            Button { editing = RuleTarget(rule: rule) } label: { content }.tint(.primary)
        } else {
            content
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
