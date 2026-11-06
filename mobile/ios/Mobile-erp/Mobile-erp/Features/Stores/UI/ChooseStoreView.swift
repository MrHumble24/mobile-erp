import SwiftUI

/// Choose a store screen (Item 2).
/// Shown after sign-in when the user works in multiple stores and none is active yet,
/// or when STORE_REQUIRED is encountered.
struct ChooseStoreView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var isChoosing = false

    var body: some View {
        let stores = container.session.user?.stores ?? []

        ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                Spacer(minLength: Tokens.Space.cardPad)

                Image(systemName: "storefront")
                    .font(.system(size: 48, weight: .regular))
                    .foregroundStyle(Tokens.action)

                VStack(spacing: Tokens.Space.xs) {
                    Text(i18n.t("stores.chooseStore"))
                        .font(.ui(.title))
                        .foregroundStyle(Tokens.text)
                    Text(i18n.t("stores.chooseStoreSubtitle"))
                        .font(.ui(.body))
                        .foregroundStyle(Tokens.muted)
                }

                Spacer(minLength: Tokens.Space.md)

                if stores.isEmpty {
                    Text(i18n.t("stores.noStores"))
                        .font(.ui(.body))
                        .foregroundStyle(Tokens.muted)
                } else {
                    AppCard(padding: 0) {
                        VStack(spacing: 0) {
                            ForEach(Array(stores.enumerated()), id: \.element.id) { i, store in
                                Button {
                                    guard !isChoosing else { return }
                                    isChoosing = true
                                    Task {
                                        await container.switchStore(store.id)
                                        isChoosing = false
                                    }
                                } label: {
                                    storeRow(store)
                                }
                                .buttonStyle(.plain)
                                if i < stores.count - 1 {
                                    Divider().overlay(Tokens.border).padding(.leading, Tokens.Space.lg)
                                }
                            }
                        }
                    }
                }

                Spacer(minLength: Tokens.Space.lg)

                Button(i18n.t("auth.logout")) {
                    container.session.logout()
                }
                .buttonStyle(.pillSecondary)

                Spacer(minLength: Tokens.Space.cardPad)
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .frame(maxWidth: 440)
            .frame(maxWidth: .infinity)
        }
        .background(Tokens.ground)
    }

    private func storeRow(_ store: UserStore) -> some View {
        HStack(spacing: Tokens.Space.md) {
            Image(systemName: "storefront")
                .font(.system(size: 18, weight: .medium))
                .foregroundStyle(Tokens.text)
                .frame(width: 24)
            Text(store.name)
                .font(.ui(.bodyStrong))
                .foregroundStyle(Tokens.text)
                .lineLimit(1)
            Spacer(minLength: Tokens.Space.sm)
            Image(systemName: "chevron.right")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(Tokens.muted)
        }
        .frame(minHeight: 56)
        .padding(.horizontal, Tokens.Space.lg)
        .padding(.vertical, Tokens.Space.sm)
        .contentShape(Rectangle())
    }
}

