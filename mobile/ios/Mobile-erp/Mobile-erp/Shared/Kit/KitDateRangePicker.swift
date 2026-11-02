import SwiftUI

/// Inclusive from/to range for filtering lists (sales, consignments, QC…). Nil
/// ends mean "open"; `isActive` tells a filter bar whether to badge itself.
struct KitDateRange: Equatable {
    var from: Date?
    var to: Date?

    static let all = KitDateRange(from: nil, to: nil)
    var isActive: Bool { from != nil || to != nil }
}

/// Field button + sheet with two `DatePicker`s. Drop it in a filter bar bound to
/// a `KitDateRange`; it shows the current range and opens the editor on tap.
///
///   @State private var range = KitDateRange.all
///   KitDateRangeField(range: $range)   // writes back ISO dates to your query
struct KitDateRangeField: View {
    @Environment(I18n.self) private var i18n
    @Binding var range: KitDateRange
    @State private var editing = false

    var body: some View {
        Button { editing = true } label: {
            Label(label, systemImage: "calendar")
                .font(.subheadline)
        }
        .buttonStyle(.bordered)
        .tint(range.isActive ? Tokens.ink : Tokens.slate)
        .sheet(isPresented: $editing) {
            KitDateRangeSheet(range: $range)
        }
    }

    private var label: String {
        guard range.isActive else {
            return i18n.t("reports.preset_custom", default: "Date range")
        }
        return "\(fmt(range.from)) – \(fmt(range.to))"
    }

    private func fmt(_ date: Date?) -> String {
        guard let date else { return "…" }
        return date.formatted(.dateTime.year().month(.abbreviated).day())
    }
}

/// Two bounded date pickers in a sheet. "Clear" resets to open; "Done" applies.
private struct KitDateRangeSheet: View {
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @Binding var range: KitDateRange

    // Local editing copies; applied on Done so Cancel-by-swipe keeps the old range.
    @State private var from: Date
    @State private var to: Date
    @State private var hasFrom: Bool
    @State private var hasTo: Bool

    init(range: Binding<KitDateRange>) {
        _range = range
        let now = Date()
        _from = State(initialValue: range.wrappedValue.from ?? now)
        _to = State(initialValue: range.wrappedValue.to ?? now)
        _hasFrom = State(initialValue: range.wrappedValue.from != nil)
        _hasTo = State(initialValue: range.wrappedValue.to != nil)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Toggle(i18n.t("reports.dateFrom", default: "From date"), isOn: $hasFrom)
                    if hasFrom {
                        DatePicker("", selection: $from, in: ...to, displayedComponents: .date)
                            .labelsHidden()
                            .datePickerStyle(.graphical)
                    }
                }
                Section {
                    Toggle(i18n.t("reports.dateTo", default: "To date"), isOn: $hasTo)
                    if hasTo {
                        DatePicker("", selection: $to, in: from..., displayedComponents: .date)
                            .labelsHidden()
                            .datePickerStyle(.graphical)
                    }
                }
            }
            .navigationTitle(i18n.t("reports.preset_custom", default: "Date range"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.clear", default: "Clear")) {
                        range = .all
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.confirm", default: "Done")) {
                        range = KitDateRange(from: hasFrom ? from : nil,
                                             to: hasTo ? to : nil)
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.large])
    }
}
