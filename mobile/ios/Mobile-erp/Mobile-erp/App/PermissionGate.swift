import SwiftUI

/// Wraps a screen that requires a permission code. Renders `content` when the
/// user `can(code)` (or the code is nil), else an inline 403. The shell also
/// hides nav entries the user can't see; this is the safety net on the route.
struct PermissionGate<Content: View>: View {
    let permission: String?
    @ViewBuilder var content: () -> Content

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    var body: some View {
        if permission == nil || container.session.can(permission!) {
            content()
        } else {
            ForbiddenPanel(
                message: i18n.t("common.forbidden",
                                default: "You don't have access to this section.")
            )
        }
    }
}
