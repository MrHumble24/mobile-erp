import SwiftUI
import UIKit

/// The haptic vocabulary (DESIGN.md / design.json): `tick` for a captured scan,
/// `success` for a completed sale or submitted batch, `error` for a duplicate or
/// rejected scan. Three feelings, one product — no screen builds its own
/// generator.
///
/// Prefer the declarative `.haptic(trigger:kind:)` modifier (iOS 17
/// `.sensoryFeedback`) at a semantic moment with an observable trigger. `play()`
/// is the imperative form for button-tap sites that have no natural trigger; it
/// routes through the same vocabulary so feedback stays consistent.
enum Haptic {
    case tick, success, error

    var sensory: SensoryFeedback {
        switch self {
        case .tick: .impact(weight: .light)
        case .success: .success
        case .error: .error
        }
    }

    @MainActor func play() {
        switch self {
        case .tick:
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        case .success:
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        case .error:
            UINotificationFeedbackGenerator().notificationOccurred(.error)
        }
    }
}

extension View {
    /// Fire `kind` whenever `trigger` changes (iOS 17 sensory feedback).
    func haptic(_ trigger: some Equatable, kind: Haptic) -> some View {
        sensoryFeedback(kind.sensory, trigger: trigger)
    }
}
