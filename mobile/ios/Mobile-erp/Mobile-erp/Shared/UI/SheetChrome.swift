import SwiftUI

/// Write-sheet chrome (DESIGN.md): the title row with its 44 pt close circle,
/// the surface-2 subject block that heads a form (never a card nested in a
/// sheet), and the inline error / offline line under a form.
/// Sheet title + the 44 pt close circle (same chrome as the QC/model sheets).
struct SheetTitleRow: View {
    @Environment(I18n.self) private var i18n
    let title: String
    let onClose: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: Tokens.Space.sm) {
            Text(title).font(.ui(.title)).foregroundStyle(Tokens.text)
            Spacer(minLength: Tokens.Space.sm)
            Button(action: onClose) {
                Image(systemName: "xmark")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Tokens.text)
                    .frame(width: Tokens.Space.minTouch, height: Tokens.Space.minTouch)
                    .background(Tokens.surface2, in: Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(i18n.t("common.close"))
        }
    }
}

/// The subject of a write sheet: a surface-2 block, never a card nested in the sheet.
struct SubjectBlock<Trailing: View>: View {
    let title: String
    let line: String
    var mono = true
    @ViewBuilder var trailing: () -> Trailing

    init(title: String, line: String, mono: Bool = true, @ViewBuilder trailing: @escaping () -> Trailing = { EmptyView() }) {
        self.title = title
        self.line = line
        self.mono = mono
        self.trailing = trailing
    }

    var body: some View {
        HStack(spacing: Tokens.Space.sm) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                Text(line).font(mono ? .data(.regular) : .ui(.body)).foregroundStyle(Tokens.text)
            }
            Spacer(minLength: 0)
            trailing()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Tokens.Space.lg)
        .background(Tokens.surface2, in: RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous))
    }
}

/// Inline error line under a form; also used for the offline notice.
struct FormErrorLine: View {
    let message: String
    var color: Color = Tokens.danger

    var body: some View {
        Text(message).font(.ui(.caption)).foregroundStyle(color)
    }
}
