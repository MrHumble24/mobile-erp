import SwiftUI
import Observation

/// Global, transient feedback banner. Any view model or view that holds the
/// `AppContainer` raises one; the overlay (mounted once at the root) renders it
/// and auto-dismisses. Messages are the caller's — pass a localized string, not
/// a key — so the kit owns no feature copy.
///
///   container.toasts.success(i18n.t("common.success"))
///   container.toasts.error(err.message)
///   container.toasts.info("Scanner connected")
enum KitToastStyle {
    case success, error, info

    var tint: Color {
        switch self {
        case .success: return Tokens.success
        case .error: return Tokens.danger
        case .info: return Tokens.signalBlue
        }
    }
    var systemImage: String {
        switch self {
        case .success: return "checkmark.circle.fill"
        case .error: return "exclamationmark.triangle.fill"
        case .info: return "info.circle.fill"
        }
    }
}

struct KitToast: Identifiable, Equatable {
    let id = UUID()
    let message: String
    let style: KitToastStyle

    static func == (lhs: KitToast, rhs: KitToast) -> Bool { lhs.id == rhs.id }
}

@Observable
@MainActor
final class KitToastCenter {
    private(set) var current: KitToast?
    private var dismissTask: Task<Void, Never>?

    func success(_ message: String) { show(message, style: .success) }
    func error(_ message: String) { show(message, style: .error) }
    func info(_ message: String) { show(message, style: .info) }

    func show(_ message: String, style: KitToastStyle, duration: Duration = .seconds(3)) {
        let toast = KitToast(message: message, style: style)
        current = toast
        dismissTask?.cancel()
        dismissTask = Task { [weak self] in
            try? await Task.sleep(for: duration)
            guard !Task.isCancelled else { return }
            if self?.current?.id == toast.id { self?.current = nil }
        }
    }

    func dismiss() {
        dismissTask?.cancel()
        current = nil
    }
}

/// Mounted once at the root (`RootView`). Reads the center from the container,
/// floats the current toast at the top with a slide/fade, glass on iOS 26.
struct KitToastOverlay: ViewModifier {
    @Environment(AppContainer.self) private var container

    func body(content: Content) -> some View {
        content.overlay(alignment: .top) {
            if let toast = container.toasts.current {
                KitToastBanner(toast: toast) { container.toasts.dismiss() }
                    .padding(.horizontal, 16)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .animation(.spring(duration: 0.3), value: toast.id)
            }
        }
    }
}

private struct KitToastBanner: View {
    let toast: KitToast
    let onTap: () -> Void

    var body: some View {
        Label {
            Text(toast.message).font(.subheadline.weight(.medium))
        } icon: {
            Image(systemName: toast.style.systemImage).foregroundStyle(toast.style.tint)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(background)
        .overlay(RoundedRectangle(cornerRadius: Tokens.Radius.cards)
            .strokeBorder(Tokens.hairline))
        .clipShape(RoundedRectangle(cornerRadius: Tokens.Radius.cards))
        .contentShape(Rectangle())
        .onTapGesture(perform: onTap)
    }

    @ViewBuilder private var background: some View {
        if #available(iOS 26, *) {
            RoundedRectangle(cornerRadius: Tokens.Radius.cards).glassEffect()
        } else {
            RoundedRectangle(cornerRadius: Tokens.Radius.cards)
                .fill(.regularMaterial)
        }
    }
}

extension View {
    /// Mount the global toast overlay once, at the app root.
    func kitToastOverlay() -> some View { modifier(KitToastOverlay()) }
}
