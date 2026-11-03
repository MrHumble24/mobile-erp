import SwiftUI

/// Search / status / overdue-only filter row for the partner directory. Stock
/// controls so system chrome (and iOS 26 glass) applies.
struct PartnersFilterBar: View {
    @Bindable var model: PartnersListModel
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
                TextField(i18n.t("partners.searchPlaceholder"), text: $model.search)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            }
            .padding(.horizontal, 12).padding(.vertical, 9)
            .background(Tokens.surface2,
                        in: RoundedRectangle(cornerRadius: Tokens.Radius.inputs, style: .continuous))

            HStack {
                Picker(i18n.t("partners.status"), selection: $model.active) {
                    ForEach(PartnersListModel.ActiveFilter.allCases) { a in
                        Text(label(a)).tag(a)
                    }
                }
                .pickerStyle(.menu)
                Spacer()
                Toggle(i18n.t("partners.overdueOnly"), isOn: $model.overdueOnly)
                    .labelsHidden()
                Text(i18n.t("partners.overdueOnly")).font(.caption).foregroundStyle(.secondary)
            }
        }
    }

    private func label(_ a: PartnersListModel.ActiveFilter) -> String {
        switch a {
        case .all: return i18n.t("common.all")
        case .active: return i18n.t("partners.active")
        case .inactive: return i18n.t("partners.inactive")
        }
    }
}
