import Foundation
import Network
import Observation

/// Network reachability via `NWPathMonitor`. `isOnline` drives the offline
/// banner and the online-only write gate; `onReconnect` fires when the device
/// regains connectivity, which the sync controller uses to push/pull. No
/// periodic timer — sync runs on launch, login, and this reconnect edge only.
@Observable
final class Connectivity {
    private(set) var isOnline = true

    @ObservationIgnored var onReconnect: (() -> Void)?
    @ObservationIgnored private let monitor = NWPathMonitor()
    @ObservationIgnored private let queue = DispatchQueue(label: "connectivity")

    init() {
        monitor.pathUpdateHandler = { [weak self] path in
            let online = path.status == .satisfied
            Task { @MainActor in self?.update(online) }
        }
        monitor.start(queue: queue)
    }

    deinit { monitor.cancel() }

    private func update(_ online: Bool) {
        let wasOffline = !isOnline
        if online != isOnline { AppLog.info("net", online ? "online" : "offline") }
        isOnline = online
        if online && wasOffline { onReconnect?() }
    }
}
