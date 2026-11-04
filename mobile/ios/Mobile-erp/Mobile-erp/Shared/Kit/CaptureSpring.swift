import SwiftUI

/// The signature capture spring (DESIGN.md "Motion & Haptics"): a scanned unit
/// springs into its list from the scan field while the rest of the list dims for
/// one beat. The only authored motion in the app. Reduce Motion replaces it with
/// a 150 ms fade and no dim.
extension AnyTransition {
    static var captureSpring: AnyTransition {
        .asymmetric(
            insertion: .offset(y: -24)
                .combined(with: .scale(scale: 0.96))
                .combined(with: .opacity),
            removal: .opacity)
    }
}

/// Put on each row inside a captured list: the spring insertion, or a fade under
/// Reduce Motion.
private struct CaptureSpringRow: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    func body(content: Content) -> some View {
        content.transition(reduceMotion ? .opacity : .captureSpring)
    }
}

/// Put on the list container: animates insertions with the spring and dims the
/// list to 0.6 for one beat (~250 ms) when an item is added. `value` is the
/// collection whose change drives the animation; `count` gates the dim beat to
/// insertions. Reduce Motion falls back to a 150 ms fade and skips the dim.
private struct CaptureSpringList<Value: Equatable>: ViewModifier {
    let value: Value
    let count: Int
    let dim: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var dimmed = false

    func body(content: Content) -> some View {
        content
            .opacity(dimmed ? 0.6 : 1)
            .animation(reduceMotion ? .easeInOut(duration: 0.15)
                                    : .spring(response: 0.35, dampingFraction: 0.75),
                       value: value)
            .onChange(of: count) { old, new in
                guard dim, !reduceMotion, new > old else { return }
                withAnimation(.easeOut(duration: 0.12)) { dimmed = true }
                Task {
                    try? await Task.sleep(for: .milliseconds(250))
                    withAnimation(.easeOut(duration: 0.12)) { dimmed = false }
                }
            }
    }
}

extension View {
    func captureSpringRow() -> some View { modifier(CaptureSpringRow()) }

    func captureSpringList<Value: Equatable>(_ value: Value, count: Int, dim: Bool = true) -> some View {
        modifier(CaptureSpringList(value: value, count: count, dim: dim))
    }
}
