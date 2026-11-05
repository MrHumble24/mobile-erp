import SwiftUI

/// Scan mode (today's till): the scan card at the top, a scan error when one
/// failed a gate, and the shared cart below. Works offline — lookups come from
/// the cache and each sale queues to the outbox.
struct PosScanPane: View {
    @Bindable var model: PosViewModel
    @Environment(I18n.self) private var i18n

    /// Screenshot helper: a seeded demo cart starts the scroll at the checkout bar
    /// so the payment control is captured. Normal launches anchor at the top.
    private var demoScrollAnchor: UnitPoint {
        #if DEBUG
        let keys = ["posDemo", "posSplit", "posSellMix"]
        if keys.contains(where: { UserDefaults.standard.string(forKey: $0) != nil }) { return .bottom }
        #endif
        return .top
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                ScannerField(placeholder: i18n.t("pos.scanPrompt")) { model.scan($0) }
                if let key = model.errorKey {
                    AppCard { PosScanErrorRow(key: key) { model.clearError() } }
                }
                PosCartColumn(model: model)
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.vertical, Tokens.Space.lg)
        }
        .defaultScrollAnchor(demoScrollAnchor)
        .scrollDismissesKeyboard(.interactively)
    }
}
