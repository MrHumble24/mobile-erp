import SwiftUI
import Observation

/// Three states of an async read. The slice's stand-in for React Query's
/// loading/error/data — every list and detail screen renders one of these.
enum Loadable<Value> {
    case loading
    case loaded(Value)
    case failed(String)
}

/// A reloadable async read. Views build one in `.task` (closing over a
/// repository) and re-run `reload()` after a successful write to refresh.
@Observable
@MainActor
final class AsyncStore<Value> {
    private(set) var state: Loadable<Value> = .loading
    @ObservationIgnored private let load: () async throws -> Value

    init(_ load: @escaping () async throws -> Value) { self.load = load }

    func reload() async {
        state = .loading
        do { state = .loaded(try await load()) }
        catch let e as AppError { state = .failed(e.message) }
        catch { state = .failed(error.localizedDescription) }
    }
}

/// Renders the three `Loadable` states with the shared UI-kit views.
struct LoadableView<Value, Content: View>: View {
    let state: Loadable<Value>
    var retry: (() -> Void)?
    @ViewBuilder let content: (Value) -> Content

    var body: some View {
        switch state {
        case .loading: LoadingView()
        case .failed(let message): ErrorStateView(message: message, retry: retry)
        case .loaded(let value): content(value)
        }
    }
}
