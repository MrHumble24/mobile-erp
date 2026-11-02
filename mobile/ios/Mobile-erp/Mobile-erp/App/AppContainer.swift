import Foundation
import SwiftData
import Observation

/// The dependency container — the app's composition root. Built once at launch
/// and injected through the SwiftUI `Environment`; features read what they need
/// (`i18n`, `session`, `modelContext`, `outbox`, `connectivity`) from it rather
/// than importing singletons. One wiring place, no global state.
@Observable
@MainActor
final class AppContainer {
    let devConfig: DevConfig
    let i18n: I18n
    let connectivity: Connectivity
    let api: APIClient
    let session: Session
    let sync: SyncController
    let modelContainer: ModelContainer
    let terminalID: String

    var modelContext: ModelContext { modelContainer.mainContext }
    var outbox: Outbox { Outbox(context: modelContext) }
    func conflicts() -> ConflictStore { ConflictStore(api: api) }

    init() {
        let keychain = Keychain()
        let devConfig = DevConfig.load()
        self.devConfig = devConfig
        self.i18n = I18n()
        self.connectivity = Connectivity()
        self.terminalID = TerminalID.load(keychain)

        // SwiftData store; fall back to in-memory if the on-disk store can't open
        // (e.g. an incompatible older schema on a dev device) so the app still runs.
        let schema = Schema(LocalSchema.models)
        self.modelContainer = (try? ModelContainer(for: schema))
            ?? (try! ModelContainer(
                for: schema,
                configurations: ModelConfiguration(isStoredInMemoryOnly: true)))

        let api = APIClient(
            baseURL: { devConfig.baseURL },
            token: { keychain.string(.token) }
        )
        self.api = api

        let session = Session(repo: AuthRepository(api: api), keychain: keychain)
        self.session = session

        let sync = SyncController(
            api: api,
            context: modelContainer.mainContext,
            terminalID: terminalID,
            hasToken: { session.hasToken }
        )
        self.sync = sync

        // Cross-wire the three runtime edges now that every part exists.
        api.onUnauthorized = { session.clear() }   // 401 → force re-login
        session.onLogin = { sync.syncNow() }        // login → hydrate cache
        connectivity.onReconnect = { sync.syncNow() } // regain network → sync
    }

    /// Called once from the root view on appear: sync if already online + signed in.
    func bootstrap() {
        #if DEBUG
        runDebugSelfChecks()
        #endif
        if connectivity.isOnline { sync.syncNow() }
    }
}
