import Foundation
import Observation

/// Loads the customs screen's three reads (current list, versions, unmatched
/// models) together and tracks load state. Online-only; a failure surfaces an
/// error the view can retry.
@MainActor
@Observable
final class CustomsModel {
    private let repo: CustomsRepository

    var current: CustomsCurrentList?
    var versions: [CustomsVersion] = []
    var unmatched: [CustomsUnmatchedModel] = []
    var loading = false
    var error: String?
    private(set) var loaded = false

    init(api: APIClient) { repo = CustomsRepository(api: api) }

    func load() async {
        loading = true
        error = nil
        do {
            async let c = repo.current()
            async let v = repo.versions()
            async let u = repo.unmatchedModels()
            (current, versions, unmatched) = try await (c, v, u)
            loaded = true
        } catch let e as AppError {
            error = e.message
        } catch {
            self.error = error.localizedDescription
        }
        loading = false
    }
}
