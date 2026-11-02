import SwiftUI

/// Transient bottom message for write results (saved / deleted / offline /
/// error) — the iOS stand-in for the web's toast. Auto-dismisses; slice-local
/// because only the expenses slice performs writes in this group.
struct ToastView: View {
    @Binding var message: String?

    var body: some View {
        if let message {
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Tokens.inkBlack.opacity(0.92), in: Capsule())
                .padding(.bottom, 24)
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .task {
                    try? await Task.sleep(nanoseconds: 2_200_000_000)
                    self.message = nil
                }
        }
    }
}
