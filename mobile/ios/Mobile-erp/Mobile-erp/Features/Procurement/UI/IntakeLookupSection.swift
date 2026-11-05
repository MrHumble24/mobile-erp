import SwiftUI

/// The "code on the box" field + its lookup result (ADR 0031). Typing or scanning
/// a box code (or a full IMEI in the slot above) asks the reference lists for the
/// model: a named product is applied automatically, an unnamed reference is shown
/// for a one-time pick, an unknown code shows a quiet hint. Credits the free list.
/// Fills only empty fields and never gates saving.
struct IntakeLookupSection: View {
    @Binding var modelId: String?
    @Binding var specs: [String: String]
    let models: [DeviceModel]
    /// The current IMEI slot (lookup also resolves a full IMEI).
    let imei: String
    /// Apply a found/picked product to the form (force = manual pick wins).
    let applyProduct: (LookupProduct, _ force: Bool) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var lookup = IntakeLookup()
    @State private var pickModelId: String?
    @State private var remember = true

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(i18n.t("catalog.boxCode")).font(.caption).foregroundStyle(Tokens.muted)
            ScanOrValueField(text: $lookup.boxCode, placeholder: i18n.t("catalog.boxCode"))
            Text(i18n.t("catalog.boxCodeHint")).font(.caption).foregroundStyle(Tokens.muted)
            statusView
            Text(i18n.t("catalog.dataCredit")).font(.caption2).foregroundStyle(Tokens.muted)
        }
        .onChange(of: imei) { _, value in lookup.update(imei: value) }
        .task {
            lookup.configure(container)
            lookup.apply = { product, force in applyProduct(product, force) }
            #if DEBUG
            _ = IntakeLookupFillSelfCheck.ran
            // Screenshot helper: `-intakeBox <code>` prefills the box-code field so
            // a capture shows the found / pick / not-found result.
            if lookup.boxCode.isEmpty, let code = KitDebugLaunch.consume("intakeBox") {
                lookup.boxCode = code
            }
            #endif
        }
    }

    @ViewBuilder private var statusView: some View {
        switch lookup.status {
        case .none:
            EmptyView()
        case .found(let model):
            Label(i18n.t("catalog.lookupFound", ["model": model]), systemImage: "checkmark.circle.fill")
                .font(.footnote).foregroundStyle(Tokens.success)
        case .notFound:
            Label(i18n.t("catalog.lookupNotFound"), systemImage: "questionmark.circle")
                .font(.footnote).foregroundStyle(Tokens.muted)
        case let .pick(brand, model, color, storage):
            pickView(brand: brand, model: model, color: color, storage: storage)
        }
    }

    private func pickView(brand: String, model: String, color: String?, storage: String?) -> some View {
        VStack(alignment: .leading, spacing: Tokens.Space.sm) {
            Text([brand, model, color, storage].compactMap { $0 }.joined(separator: " · "))
                .font(.footnote).foregroundStyle(Tokens.text)
            Text(i18n.t("catalog.lookupPickProduct")).font(.caption).foregroundStyle(Tokens.muted)
            AppSelect(placeholder: i18n.t("catalog.lookupPickProduct"), selection: $pickModelId,
                      options: [(String?.none, "—")] + unitModels.map { (String?.some($0.id), $0.label) })
            if lookup.canUpdate {
                Toggle(i18n.t("catalog.lookupRemember"), isOn: $remember)
                    .toggleStyle(AppSwitchStyle()).font(.footnote)
            }
            if lookup.remembered {
                Text(i18n.t("catalog.lookupRemembered")).font(.caption).foregroundStyle(Tokens.success)
            }
            Button(i18n.t("catalog.lookupFill")) {
                if let id = pickModelId { lookup.pick(modelId: id, remember: remember, models: models) }
            }
            .buttonStyle(.pillSecondary)
            .disabled(pickModelId == nil)
        }
    }

    /// Only unit products can take a scanned/typed code (quantity ones are not
    /// stocked as units).
    private var unitModels: [DeviceModel] { models.filter { !$0.isQuantity } }
}
