import SwiftUI

/// One chip: its value, label, optional mono count and the hue it takes when selected.
struct TabChipItem<Value: Hashable> {
    let value: Value
    let label: String
    var count: Int? = nil
    var hue: Color = Tokens.text
}

/// Tabs as a scrolling chip row (DESIGN.md): where a fixed `SegmentedControl`
/// would truncate three or more labels. Selected = hue pill pair; counts in mono.
struct TabChips<Value: Hashable>: View {
    @Binding var selection: Value
    let items: [TabChipItem<Value>]
    var onChange: () -> Void = {}

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Tokens.Space.sm) {
                ForEach(items, id: \.value) { item in chip(item) }
            }
            .padding(.horizontal, Tokens.Space.gutter)
        }
    }

    private func chip(_ item: TabChipItem<Value>) -> some View {
        let selected = item.value == selection
        return Button {
            guard !selected else { return }
            Haptic.tick.play()
            selection = item.value
            onChange()
        } label: {
            HStack(spacing: Tokens.Space.sm) {
                Text(item.label).font(.ui(.label)).foregroundStyle(selected ? item.hue : Tokens.muted).lineLimit(1)
                if let count = item.count {
                    Text("\(count)").font(.mono(12, weight: .semibold)).foregroundStyle(selected ? item.hue : Tokens.text)
                }
            }
            .padding(.horizontal, Tokens.Space.lg)
            .frame(height: 40)
            .background(selected ? item.hue.opacity(0.14) : Tokens.card, in: Capsule())
        }
        .buttonStyle(.plain)
    }
}
