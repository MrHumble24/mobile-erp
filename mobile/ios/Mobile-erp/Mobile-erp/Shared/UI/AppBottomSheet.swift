import SwiftUI

/// Warm Card sheet chrome (DESIGN.md: "a sheet is a card that rises from the
/// bottom on the ground tint"): medium/large detents, no drag handle, a `card`
/// background and a 20 pt corner radius. Apply to any sheet's content so every
/// sheet reads the same.
struct AppBottomSheetChrome: ViewModifier {
    func body(content: Content) -> some View {
        content
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.hidden)
            .presentationBackground(Tokens.card)
            .presentationCornerRadius(20)
    }
}

extension View {
    /// Apply the Warm Card presentation chrome to this sheet's content.
    func appBottomSheet() -> some View { modifier(AppBottomSheetChrome()) }

    /// `.sheet(isPresented:)` that rises as a Warm Card sheet.
    func appSheet<Content: View>(
        isPresented: Binding<Bool>,
        onDismiss: (() -> Void)? = nil,
        @ViewBuilder content: @escaping () -> Content
    ) -> some View {
        sheet(isPresented: isPresented, onDismiss: onDismiss) {
            content().appBottomSheet()
        }
    }

    /// `.sheet(item:)` that rises as a Warm Card sheet.
    func appSheet<Item: Identifiable, Content: View>(
        item: Binding<Item?>,
        onDismiss: (() -> Void)? = nil,
        @ViewBuilder content: @escaping (Item) -> Content
    ) -> some View {
        sheet(item: item, onDismiss: onDismiss) { value in
            content(value).appBottomSheet()
        }
    }
}
