import SwiftUI

/// Procurement writes (supplier / shipment / device-intake / QC) are NOT among
/// the four offline-queueable mutation types, so they are online-only and must
/// never fake-queue. A form calls this before submitting: nil means go ahead,
/// a non-nil string is the "needs connection" message to show.
@MainActor
func offlineBlock(_ container: AppContainer, _ i18n: I18n) -> String? {
    container.connectivity.isOnline
        ? nil
        : i18n.t("common.offline", default: "No connection to the server. Reconnect to save.")
}
