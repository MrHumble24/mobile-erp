import SwiftUI

/// The till shift bar (ADR 0036): when shifts are on, shows the open shift (open
/// since HH:mm + Close shift) or "No open shift" + Open shift. Hidden when the
/// setting is off. Drives the open / close sheets and the post-close report.
struct ShiftBar: View {
    @Bindable var model: ShiftModel
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    var body: some View {
        if model.shiftsEnabled {
            HStack(spacing: Tokens.Space.sm) {
                if let shift = model.current {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(i18n.t("shifts.openSince", ["time": ShiftTime.time(shift.openedAt)]))
                            .font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                        Text(shift.cashier.name).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    }
                    Spacer(minLength: Tokens.Space.sm)
                    Button(i18n.t("shifts.closeShift")) { model.showClose = true }
                        .buttonStyle(.pillSecondary)
                } else {
                    Label(i18n.t("shifts.noOpenShift"), systemImage: "clock.badge.xmark")
                        .font(.ui(.body)).foregroundStyle(Tokens.muted)
                    Spacer(minLength: Tokens.Space.sm)
                    Button(i18n.t("shifts.openShift")) { model.showOpen = true }
                        .buttonStyle(.pillPrimary)
                }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.vertical, Tokens.Space.sm)
            .background(Tokens.card)
            .appSheet(isPresented: $model.showOpen) { OpenShiftSheet(model: model) }
            .appSheet(isPresented: $model.showClose) { CloseShiftSheet(model: model) }
            .task { if !model.loaded { await model.load() } }
        }
    }
}

/// ISO date-time → a short local `HH:mm`, for the "open since" line.
enum ShiftTime {
    static func time(_ iso: String?) -> String {
        guard let date = KitDate.parse(iso) else { return "" }
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "HH:mm"
        return f.string(from: date)
    }
}
