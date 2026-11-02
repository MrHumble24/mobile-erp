import SwiftUI

/// Centered spinner for pending states.
struct LoadingView: View {
    var body: some View {
        ProgressView()
            .controlSize(.large)
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
        } description: {
            if let message { Text(message) }
        }
    }
}

/// Error state with the failure message and an optional retry.
struct ErrorStateView: View {
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
                Button("Try again", action: retry)
                    .buttonStyle(.bordered)
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
                .foregroundStyle(.secondary)
        }
    }
}
