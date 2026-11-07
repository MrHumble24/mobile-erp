import SwiftUI

/// Branded launch splash view that seamlessly matches the native `UILaunchScreen`.
/// Fills the viewport with `Tokens.ground`, shows the centered card logo, app title,
/// and smooth loading state while cold-start bootstrap / authentication restores.
struct SplashView: View {
    @State private var pulse = false

    var body: some View {
        ZStack {
            Tokens.ground
                .ignoresSafeArea()

            VStack(spacing: 20) {
                // Centered App Emblem (matches LaunchLogo pixel-for-pixel)
                ZStack {
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .fill(Tokens.card)
                        .frame(width: 88, height: 88)
                        .overlay(
                            RoundedRectangle(cornerRadius: 22, style: .continuous)
                                .stroke(Tokens.border, lineWidth: 1.5)
                        )
                        .shadow(color: Tokens.text.opacity(0.06), radius: 10, x: 0, y: 4)

                    // Monogram M in Warm Action Orange
                    MonogramShape()
                        .stroke(
                            Tokens.action,
                            style: StrokeStyle(lineWidth: 6, lineCap: .round, lineJoin: .round)
                        )
                        .frame(width: 44, height: 44)
                }
                .scaleEffect(pulse ? 1.03 : 0.98)
                .animation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true), value: pulse)

                VStack(spacing: 6) {
                    Text("MALIKA ERP")
                        .font(.custom("Onest-Bold", size: 20))
                        .foregroundStyle(Tokens.text)
                        .tracking(1.0)

                    Text("POS & savdo boshqaruv tizimi")
                        .font(.custom("Onest-Regular", size: 13))
                        .foregroundStyle(Tokens.muted)
                }

                ProgressView()
                    .controlSize(.regular)
                    .tint(Tokens.action)
                    .padding(.top, 16)
            }
        }
        .onAppear {
            pulse = true
        }
    }
}

/// Custom Monogram path corresponding to the AppIcon and LaunchLogo vector.
private struct MonogramShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let w = rect.width
        let h = rect.height

        path.move(to: CGPoint(x: 0, y: h))
        path.addLine(to: CGPoint(x: 0, y: 0))
        path.addLine(to: CGPoint(x: w / 2, y: h * 0.65))
        path.addLine(to: CGPoint(x: w, y: 0))
        path.addLine(to: CGPoint(x: w, y: h))

        return path
    }
}

