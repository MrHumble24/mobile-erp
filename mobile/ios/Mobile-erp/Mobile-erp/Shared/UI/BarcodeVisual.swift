import SwiftUI

/// Decorative barcode visual with monospace value caption for receipts and tags.
/// Deterministically mirrors `client/src/shared/ui/barcode-visual.tsx`.
struct BarcodeVisual: View {
    let value: String
    var height: CGFloat = 32

    private struct Bar: Identifiable {
        let id: Int
        let width: CGFloat
        let isHidden: Bool
    }

    private var bars: [Bar] {
        guard !value.isEmpty else { return [] }
        let chars = Array(value.utf8)
        let count = max(chars.count, 1)
        return (0..<42).map { i in
            let charCode = Int(chars[i % count])
            let isThick = ((charCode + i * 7) % 3) == 0
            let isMedium = ((charCode + i * 5) % 2) == 0
            let width: CGFloat = isThick ? 3 : (isMedium ? 2 : 1)
            let isHidden = (i * 13) % 9 == 0 && i > 3 && i < 38
            return Bar(id: i, width: width, isHidden: isHidden)
        }
    }

    var body: some View {
        if !value.isEmpty {
            VStack(spacing: 4) {
                HStack(alignment: .center, spacing: 2) {
                    ForEach(bars) { bar in
                        Rectangle()
                            .fill(Tokens.text)
                            .opacity(bar.isHidden ? 0 : 1)
                            .frame(width: bar.width, height: height)
                    }
                }
                .padding(.horizontal, 4)

                Text(value)
                    .font(.mono(9, weight: .semibold))
                    .tracking(2)
                    .foregroundStyle(Tokens.muted)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 4)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(value)
        }
    }
}

