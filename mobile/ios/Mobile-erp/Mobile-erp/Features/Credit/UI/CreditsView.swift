import SwiftUI

/// Customer credits list (ADR 0035): a status chip row (all / open / overdue /
/// paid in full), a name/phone search and the credit rows. Tap a row for its
/// detail, payments and contract. Online only — offline shows a note.
struct CreditsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = CreditsListModel()
    @State private var selected: CreditListItem?

    var body: some View {
        @Bindable var model = model
        VStack(spacing: 0) {
            TabChips(selection: $model.status,
                     items: CreditStatusFilter.allCases.map { TabChipItem(value: $0, label: i18n.t($0.labelKey)) })
                .padding(.vertical, Tokens.Space.md)
                .onChange(of: model.status) { _, _ in model.reload() }
            content
        }
        .background(Tokens.ground)
        .navigationTitle(i18n.t("credit.title"))
        .searchable(text: $model.search, prompt: i18n.t("customers.searchPlaceholder", default: "Search"))
        .appSheet(item: $selected) { credit in
            CreditDetailSheet(creditId: credit.id) { model.reload() }
        }
        .task {
            model.configure(container)
            #if DEBUG
            _ = CreditPlanSelfCheck.ran
            #endif
            if model.credits.isEmpty { model.reload() }
        }
        .refreshable { model.reload() }
        #if DEBUG
        // Screenshot helper: `-openCredit first` opens the first credit's detail.
        .onChange(of: model.credits.count) { _, count in
            if count > 0, KitDebugLaunch.consume("openCredit") != nil { selected = model.rows.first }
        }
        #endif
    }

    @ViewBuilder private var content: some View {
        if model.offline {
            EmptyStateView(systemImage: "wifi.slash", title: i18n.t("common.offline"),
                           message: i18n.t("credit.errorOffline"))
        } else if model.loading && model.credits.isEmpty {
            LoadingView()
        } else if let error = model.error, model.credits.isEmpty {
            ErrorStateView(message: error) { model.reload() }
        } else if model.rows.isEmpty {
            EmptyStateView(systemImage: "banknote", title: i18n.t("credit.noCredits"))
        } else {
            ScrollView {
                VStack(spacing: Tokens.Space.md) {
                    ForEach(model.rows) { credit in
                        Button { selected = credit } label: { CreditRow(credit: credit) }
                            .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, Tokens.Space.gutter)
                .padding(.vertical, Tokens.Space.md)
            }
        }
    }
}

/// One credit row: customer + date, left-to-pay, and an overdue / paid-in-full tag.
private struct CreditRow: View {
    let credit: CreditListItem
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            HStack(alignment: .center, spacing: Tokens.Space.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(credit.customer.name).font(.ui(.body)).foregroundStyle(Tokens.text)
                    Text(KitDate.day(credit.createdAt)).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    if credit.settled {
                        StatusBadge(i18n.t("credit.settled"), color: Tokens.success)
                    } else if credit.isOverdue {
                        StatusBadge("\(i18n.t("credit.overdue")) \(MoneyText.format(credit.overdueAmount))", color: Tokens.danger)
                    }
                }
                Spacer(minLength: Tokens.Space.sm)
                VStack(alignment: .trailing, spacing: 2) {
                    Text(i18n.t("credit.outstanding")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    MoneyText(value: credit.outstanding, size: 16)
                        .fontWeight(.semibold)
                        .foregroundStyle(credit.settled ? Tokens.muted : Tokens.text)
                }
            }
        }
    }
}
