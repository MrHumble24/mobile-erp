import SwiftUI
import UIKit

/// Developer panel view to configure and toggle quick login credential fillers.
struct DevQuickLoginView: View {
    @Environment(AppContainer.self) private var container
    @State private var copiedId: String?

    var body: some View {
        @Bindable var devAccess = container.devAccess

        List {
            // Master Toggle Section
            Section {
                Toggle(isOn: $devAccess.quickLoginEnabled) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Show Quick Login on Sign-In")
                            .font(.body.weight(.semibold))
                            .foregroundStyle(Tokens.ink)
                        Text("Display 1-tap role chips on the terminal sign-in screen for rapid testing.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .tint(Tokens.success)
            } header: {
                Text("Configuration")
            }

            // Seeded Accounts Section
            Section {
                ForEach(DevAccounts.all) { account in
                    DevAccountCard(account: account, copiedId: $copiedId)
                }
            } header: {
                Text("Pre-configured Seed Accounts")
            } footer: {
                Text("Credentials correspond to local development seed data in Malika Bazaar test database.")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .listStyle(.insetGrouped)
    }
}

/// One card displaying a seeded test account's credentials with one-tap copy actions.
private struct DevAccountCard: View {
    let account: DevAccount
    @Binding var copiedId: String?
    @State private var showPassword = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: account.icon)
                    .foregroundStyle(account.badgeColor)
                Text(account.label)
                    .font(.headline)
                    .foregroundStyle(Tokens.ink)
                Spacer()
                Text(account.roleName)
                    .font(.caption2.weight(.medium))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(account.badgeColor.opacity(0.12), in: Capsule())
                    .foregroundStyle(account.badgeColor)
            }

            VStack(alignment: .leading, spacing: 6) {
                // Email Row
                HStack {
                    Text("Email:")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.secondary)
                        .frame(width: 65, alignment: .leading)
                    Text(account.email)
                        .font(.mono(13))
                        .foregroundStyle(Tokens.ink)
                    Spacer()
                    Button {
                        copy(account.email, id: "\(account.id)-email")
                    } label: {
                        Image(systemName: copiedId == "\(account.id)-email" ? "checkmark.circle.fill" : "doc.on.doc")
                            .font(.caption)
                            .foregroundStyle(copiedId == "\(account.id)-email" ? Tokens.success : .secondary)
                    }
                    .buttonStyle(.plain)
                }

                // Password Row
                HStack {
                    Text("Password:")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.secondary)
                        .frame(width: 65, alignment: .leading)
                    Text(showPassword ? account.password : String(repeating: "•", count: 12))
                        .font(.mono(13))
                        .foregroundStyle(Tokens.ink)
                    Spacer()
                    Button {
                        showPassword.toggle()
                    } label: {
                        Image(systemName: showPassword ? "eye.slash" : "eye")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .buttonStyle(.plain)
                    .padding(.trailing, 6)

                    Button {
                        copy(account.password, id: "\(account.id)-pwd")
                    } label: {
                        Image(systemName: copiedId == "\(account.id)-pwd" ? "checkmark.circle.fill" : "doc.on.doc")
                            .font(.caption)
                            .foregroundStyle(copiedId == "\(account.id)-pwd" ? Tokens.success : .secondary)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(10)
            .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: Tokens.Radius.inputs))
        }
        .padding(.vertical, 4)
    }

    private func copy(_ text: String, id: String) {
        UIPasteboard.general.string = text
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        copiedId = id
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            if copiedId == id { copiedId = nil }
        }
    }
}
