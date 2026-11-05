import SwiftUI

/// Warm Card segmented control (DESIGN.md): a 44 pt `surface2` track with the
/// selected segment lifted onto a white `card` pill, radius 12. Replaces
/// `.pickerStyle(.segmented)`, which shows through untinted. State reads from
/// colour, not weight.
struct SegmentedControl<Value: Hashable>: View {
    @Binding var selection: Value
    let segments: [(value: Value, label: String)]

    @Namespace private var pill

    var body: some View {
        HStack(spacing: 0) {
            ForEach(segments, id: \.value) { segment in
                let selected = segment.value == selection
                Button {
                    withAnimation(.easeOut(duration: 0.18)) { selection = segment.value }
                } label: {
                    Text(segment.label)
                        .font(.ui(.body))
                        .foregroundStyle(selected ? Tokens.text : Tokens.muted)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                        .frame(maxWidth: .infinity)
                        .frame(height: Tokens.Space.minTouch - Tokens.Space.sm)
                        .background {
                            if selected {
                                RoundedRectangle(cornerRadius: Tokens.Radius.controls - 2, style: .continuous)
                                    .fill(Tokens.card)
                                    .matchedGeometryEffect(id: "pill", in: pill)
                            }
                        }
                }
                .buttonStyle(.plain)
            }
        }
        .padding(Tokens.Space.xs)
        .frame(height: Tokens.Space.minTouch)
        .background(
            RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous)
                .fill(Tokens.surface2)
        )
    }
}
