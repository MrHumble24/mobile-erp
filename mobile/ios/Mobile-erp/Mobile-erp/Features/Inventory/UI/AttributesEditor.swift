import SwiftUI

/// Controlled editor for a model's spec schema: add / remove / reorder
/// `AttributeDef` rows. Keys already persisted are locked (renaming orphans
/// device specs). Rendered as Form sections; the parent owns the list.
struct AttributesEditor: View {
    @Binding var attributes: [AttributeDef]
    let savedKeys: Set<String>
    @Environment(I18n.self) private var i18n

    var body: some View {
        Section {
            ForEach(attributes.indices, id: \.self) { i in
                AttributeRow(
                    attr: $attributes[i],
                    keyLocked: savedKeys.contains(attributes[i].key),
                    canMoveUp: i > 0,
                    canMoveDown: i < attributes.count - 1,
                    onMoveUp: { attributes.swapAt(i, i - 1) },
                    onMoveDown: { attributes.swapAt(i, i + 1) },
                    onRemove: { attributes.remove(at: i) }
                )
            }
        } header: {
            HStack {
                Text(i18n.t("inventory.attrSectionTitle"))
                Spacer()
                Button {
                    attributes.append(AttributeDef(sortOrder: attributes.count))
                } label: {
                    Label(i18n.t("inventory.attrAdd"), systemImage: "plus")
                }
                .textCase(nil)
            }
        }
    }
}

private struct AttributeRow: View {
    @Binding var attr: AttributeDef
    let keyLocked: Bool
    let canMoveUp: Bool
    let canMoveDown: Bool
    let onMoveUp: () -> Void
    let onMoveDown: () -> Void
    let onRemove: () -> Void
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(spacing: 8) {
            TextField(i18n.t("inventory.attrLabel"), text: $attr.label)
            TextField(i18n.t("inventory.attrKey"), text: $attr.key)
                .disabled(keyLocked)
                .foregroundStyle(keyLocked ? .secondary : .primary)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
            Picker(i18n.t("inventory.attrType"), selection: $attr.type) {
                Text(i18n.t("inventory.attrTypeText")).tag(AttributeType.text)
                Text(i18n.t("inventory.attrTypeNumber")).tag(AttributeType.number)
                Text(i18n.t("inventory.attrTypeSelect")).tag(AttributeType.select)
            }
            Toggle(i18n.t("inventory.attrRequired"), isOn: $attr.required)
            if attr.type == .select {
                OptionsChipsEditor(options: $attr.options)
            }
            HStack {
                Spacer()
                Button(action: onMoveUp) { Image(systemName: "arrow.up") }.disabled(!canMoveUp)
                Button(action: onMoveDown) { Image(systemName: "arrow.down") }.disabled(!canMoveDown)
                Button(role: .destructive, action: onRemove) { Image(systemName: "trash") }
            }
            .buttonStyle(.borderless)
        }
        .padding(.vertical, 4)
    }
}

/// Chip editor for a `select` attribute's options: type + Add, tap X to remove.
private struct OptionsChipsEditor: View {
    @Binding var options: [String]
    @Environment(I18n.self) private var i18n
    @State private var draft = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(i18n.t("inventory.attrOptions")).font(.caption).foregroundStyle(.secondary)
            if !options.isEmpty {
                WrapChips(options: options, onRemove: { opt in options.removeAll { $0 == opt } })
            }
            HStack {
                TextField(i18n.t("inventory.attrOptionsPlaceholder"), text: $draft)
                    .onSubmit(add)
                Button(i18n.t("common.add"), action: add).disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
    }

    private func add() {
        let value = draft.trimmingCharacters(in: .whitespaces)
        draft = ""
        guard !value.isEmpty, !options.contains(value) else { return }
        options.append(value)
    }
}

private struct WrapChips: View {
    let options: [String]
    let onRemove: (String) -> Void

    var body: some View {
        // Simple wrapping flow of chips via a flexible grid.
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 80), spacing: 6)], alignment: .leading, spacing: 6) {
            ForEach(options, id: \.self) { opt in
                HStack(spacing: 4) {
                    Text(opt).font(.caption)
                    Button { onRemove(opt) } label: { Image(systemName: "xmark.circle.fill").font(.caption2) }
                        .buttonStyle(.plain)
                }
                .padding(.horizontal, 10).padding(.vertical, 5)
                .background(Tokens.ink.opacity(0.08), in: Capsule())
            }
        }
    }
}
