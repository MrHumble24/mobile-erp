import SwiftUI

/// One current-list row: code + description, the fee, the previous fee and a
/// change marker, and whether any of our models uses the code.
struct CustomsCurrentRow: View {
    let item: CustomsCurrentItem
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                HStack(alignment: .firstTextBaseline) {
                    Text(item.customsCode).font(.data(.regular)).foregroundStyle(Tokens.text)
                    Spacer(minLength: Tokens.Space.sm)
                    MoneyText(value: item.fee, size: 15).fontWeight(.semibold)
                }
                if let description = item.description, !description.isEmpty {
                    Text(description).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                HStack(spacing: Tokens.Space.sm) {
                    changeBadge
                    if let prev = item.previousFee {
                        Text(i18n.t("customs.previousFee") + ": " + MoneyText.format(prev))
                            .font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    }
                    Spacer(minLength: Tokens.Space.sm)
                    StatusBadge(i18n.t(item.usedByModel ? "customs.usedByModel" : "customs.notUsed"),
                                color: item.usedByModel ? Tokens.info : Tokens.muted)
                }
            }
        }
    }

    private var changeBadge: some View {
        let (key, color): (String, Color) = switch item.change {
        case .up: ("customs.wentUp", Tokens.danger)
        case .down: ("customs.wentDown", Tokens.success)
        case .same: ("customs.unchanged", Tokens.muted)
        case .new: ("customs.newItem", Tokens.info)
        }
        return StatusBadge(i18n.t(key), color: color)
    }
}

/// One version row: effective date, note and item count.
struct CustomsVersionRow: View {
    let version: CustomsVersion
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                HStack {
                    Text(KitDate.day(version.effectiveAt)).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                    Spacer()
                    Text(i18n.t("customs.itemCount", ["count": "\(version.itemCount)"]))
                        .font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                if let note = version.note, !note.isEmpty {
                    Text(note).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
            }
        }
    }
}

/// One unmatched-model row: model label, its code (if any) and the reason.
struct CustomsUnmatchedRow: View {
    let model: CustomsUnmatchedModel
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                HStack {
                    Text(model.label).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                    Spacer()
                    if let code = model.customsCode, !code.isEmpty {
                        Text(code).font(.data(.regular)).foregroundStyle(Tokens.muted)
                    }
                }
                Text(i18n.t(model.reasonKey)).font(.ui(.caption)).foregroundStyle(Tokens.warning)
            }
        }
    }
}
