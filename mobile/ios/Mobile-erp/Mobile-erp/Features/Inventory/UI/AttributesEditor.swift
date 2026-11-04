import SwiftUI

/// Controlled editor for a model's spec schema: add / remove / reorder
/// `AttributeDef` rows. Keys already persisted are locked (renaming orphans
/// device specs). Each attribute is a surface-2 block inside the sheet, built
/// from kit fields (never a Form section); the parent owns the list.
struct AttributesEditor: View {
    @Binding var attributes: [AttributeDef]
    let savedKeys: Set<String>
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.md) {
            HStack {
                Text(i18n.t("inventory.attrSectionTitle")).font(.ui(.heading)).foregroundStyle(Tokens.text)
                Spacer()
                Button(i18n.t("inventory.attrAdd")) {
                    attributes.append(AttributeDef(sortOrder: attributes.count))
                }
                .buttonStyle(.pillSecondary)
            }
            ForEach(attributes.indices, id: \.self) { i in
                AttributeBlock(
                    attr: $attributes[i],
                    keyLocked: savedKeys.contains(attributes[i].key),
                    canMoveUp: i > 0,
                    canMoveDown: i < attributes.count - 1,
                    onMoveUp: { attributes.swapAt(i, i - 1) },
                    onMoveDown: { attributes.swapAt(i, i + 1) },
                    onRemove: { attributes.remove(at: i) }
                )
            }
        }
    }
}

private struct AttributeBlock: View {
    @Binding var attr: AttributeDef
    let keyLocked: Bool
    let canMoveUp: Bool
    let canMoveDown: Bool
    let onMoveUp: () -> Void
    let onMoveDown: () -> Void
    let onRemove: () -> Void
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.md) {
            AppFormField(label: i18n.t("inventory.attrLabel")) {
                AppTextField(placeholder: i18n.t("inventory.attrLabel"), text: $attr.label)
            }
            AppFormField(label: i18n.t("inventory.attrKey")) {
                AppTextField(placeholder: i18n.t("inventory.attrKey"), text: $attr.key,
                             keyboard: .asciiCapable, autocapitalization: .never, disableAutocorrection: true)
                    .disabled(keyLocked)
                    .opacity(keyLocked ? 0.6 : 1)
            }
            AppFormField(label: i18n.t("inventory.attrType")) {
                AppSelect(placeholder: i18n.t("inventory.attrType"), selection: $attr.type, options: [
                    (.text, i18n.t("inventory.attrTypeText")),
                    (.number, i18n.t("inventory.attrTypeNumber")),
                    (.select, i18n.t("inventory.attrTypeSelect")),
                ])
            }
            if attr.type == .select {
                OptionsChipsEditor(options: $attr.options)
            }
            Toggle(i18n.t("inventory.attrRequired"), isOn: $attr.required)
                .font(.ui(.body))
                .foregroundStyle(Tokens.text)
                .frame(minHeight: Tokens.Space.minTouch)
            HStack(spacing: Tokens.Space.sm) {
                Spacer()
                iconButton("arrow.up", enabled: canMoveUp, action: onMoveUp)
                iconButton("arrow.down", enabled: canMoveDown, action: onMoveDown)
                iconButton("trash", enabled: true, tint: Tokens.danger, action: onRemove)
            }
        }
        .padding(Tokens.Space.lg)
        .background(Tokens.surface2, in: RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous))
    }

    private func iconButton(_ symbol: String, enabled: Bool, tint: Color = Tokens.muted,
                            action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(enabled ? tint : Tokens.border)
                .frame(width: Tokens.Space.minTouch, height: Tokens.Space.minTouch)
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
    }
}

/// Chip editor for a `select` attribute's options: type, then Return or the
/// explicit add pill commits the value; tap × on a chip to remove it.
private struct OptionsChipsEditor: View {
    @Binding var options: [String]
    @Environment(I18n.self) private var i18n
    @State private var draft = ""

    private var trimmed: String { draft.trimmingCharacters(in: .whitespaces) }

    var body: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.sm) {
            Text(i18n.t("inventory.attrOptions")).font(.ui(.label)).foregroundStyle(Tokens.muted)
            if !options.isEmpty {
                WrapChips(options: options, onRemove: { opt in options.removeAll { $0 == opt } })
            }
            HStack(spacing: Tokens.Space.sm) {
                AppTextField(placeholder: i18n.t("inventory.attrOptionsPlaceholder"), text: $draft)
                    .onSubmit(add)
                // Ghost, not secondary: a surface-2 fill would vanish on this surface-2 block.
                Button(i18n.t("common.add"), action: add)
                    .buttonStyle(.pillGhost)
                    .disabled(trimmed.isEmpty)
            }
        }
    }

    private func add() {
        let value = trimmed
        draft = ""
        guard !value.isEmpty, !options.contains(value) else { return }
        options.append(value)
    }
}

private struct WrapChips: View {
    let options: [String]
    let onRemove: (String) -> Void

    var body: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 88), spacing: Tokens.Space.sm)],
                  alignment: .leading, spacing: Tokens.Space.sm) {
            ForEach(options, id: \.self) { opt in
                HStack(spacing: Tokens.Space.xs) {
                    Text(opt).font(.ui(.label)).foregroundStyle(Tokens.text).lineLimit(1)
                    Button { onRemove(opt) } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(Tokens.muted)
                            .frame(width: Tokens.Space.gutter, height: Tokens.Space.gutter)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.leading, Tokens.Space.md)
                .padding(.trailing, Tokens.Space.xs)
                .padding(.vertical, 6)
                .background(Tokens.card, in: Capsule())
            }
        }
    }
}
