import SwiftUI

/// Centered spinner for pending states.
struct LoadingView: View {
    var body: some View {
        ProgressView()
            .controlSize(.large)
            .tint(Tokens.muted)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

/// "Nothing here yet" placeholder (stock `ContentUnavailableView`).
struct EmptyStateView: View {
    var systemImage = "tray"
    let title: String
    var message: String?

    var body: some View {
        ContentUnavailableView {
            Label(title, systemImage: systemImage)
                .foregroundStyle(Tokens.muted)
        } description: {
            if let message { Text(message) }
        }
    }
}

/// Error state with the failure message and an optional retry. The retry label
/// comes from `common.retry` and sits on the kit's secondary pill, never a stock
/// bordered button.
struct ErrorStateView: View {
    @Environment(I18n.self) private var i18n
    let message: String
    var retry: (() -> Void)?

    var body: some View {
        ContentUnavailableView {
            Label("", systemImage: "exclamationmark.triangle")
                .foregroundStyle(Tokens.danger)
        } description: {
            Text(message)
        } actions: {
            if let retry {
                Button(i18n.t("common.retry"), action: retry)
                    .buttonStyle(.pillSecondary)
            }
        }
    }
}

/// Inline 403 shown when the user opens a section they lack permission for.
struct ForbiddenPanel: View {
    var message: String

    var body: some View {
        ContentUnavailableView {
            Label(message, systemImage: "lock")
                .foregroundStyle(Tokens.muted)
        }
    }
}
