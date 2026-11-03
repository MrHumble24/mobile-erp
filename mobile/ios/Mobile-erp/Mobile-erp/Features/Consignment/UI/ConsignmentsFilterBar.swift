import SwiftUI

/// Search / status / period filter row for consignments. Changes trigger a
/// reload (the list is server-filtered + paginated). Period maps to the
/// `from`/`to` query bounds.
struct ConsignmentsFilterBar: View {
    @Bindable var model: ConsignmentsListModel
    var onChange: () -> Void

    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
                TextField(i18n.t("consignments.searchPlaceholder"), text: $model.search)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .submitLabel(.search)
                    .onSubmit(onChange)
            }
            .padding(.horizontal, 12).padding(.vertical, 9)
            .background(Tokens.surface2,
                        in: RoundedRectangle(cornerRadius: Tokens.Radius.inputs, style: .continuous))

            HStack {
                Picker(i18n.t("consignments.filterStatus"), selection: $model.status) {
                    ForEach(ConsignmentStatusFilter.allCases) { s in
                        Text(i18n.t(s.labelKey)).tag(s)
                    }
                }
                Spacer()
                Picker(i18n.t("reports.period"), selection: $model.preset) {
                    ForEach(RangePreset.allCases) { p in
                        Text(p.labelKey.map { i18n.t($0) } ?? i18n.t("common.all")).tag(p)
                    }
                }
            }
            .pickerStyle(.menu)
            .onChange(of: model.status) { resetAndReload() }
            .onChange(of: model.preset) { resetAndReload() }

            if model.preset == .custom {
                HStack {
                    DateField(label: i18n.t("reports.dateFrom"), value: $model.customFrom, onCommit: onChange)
                    DateField(label: i18n.t("reports.dateTo"), value: $model.customTo, onCommit: onChange)
                }
            }
        }
    }

    private func resetAndReload() {
        onChange()
    }
}

/// A yyyy-MM-dd date field backed by a stock `DatePicker`.
private struct DateField: View {
    let label: String
    @Binding var value: String
    var onCommit: () -> Void

    private static let fmt: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(identifier: "UTC")
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    var body: some View {
        let binding = Binding<Date>(
            get: { Self.fmt.date(from: value) ?? Date() },
            set: { value = Self.fmt.string(from: $0); onCommit() })
        VStack(alignment: .leading, spacing: 3) {
            Text(label).font(.caption).foregroundStyle(.secondary)
            DatePicker("", selection: binding, displayedComponents: .date)
                .labelsHidden()
        }
    }
}
