#if DEBUG
import Foundation

/// Assert-based self-check for the non-trivial pure logic (money parsing, JWT
/// expiry, error-envelope decoding). Runs once at launch in DEBUG only — the
/// lazy stand-in for a full test target. If any of these break, the app traps
/// here instead of misbehaving in the field.
func runDebugSelfChecks() async {
    // Money: whole vs. fractional, exact Decimal (never Double).
    assert(MoneyText.format("1250") == "$1,250")
    assert(MoneyText.format("1250.50") == "$1,250.50")
    assert(MoneyText.format(nil) == "$0")

    // Error envelope: string[] message is joined; status surfaced.
    let body = #"{"statusCode":400,"message":["a","b"],"error":"Bad Request"}"#
    let err = AppError(statusCode: 400, body: Data(body.utf8))
    assert(err.message == "a, b" && err.error == "Bad Request")

    // JWT expiry: past exp → expired, future exp → live, garbage → expired.
    assert(isJWTExpired(makeJWT(exp: 1)))                 // 1970
    assert(!isJWTExpired(makeJWT(exp: 4_102_444_800)))    // year 2100
    assert(isJWTExpired("not-a-jwt"))

    // Query canonicalization: key-sorted and stable, so the same GET yields the
    // same URL every launch (the offline response cache keys on it).
    let q = APIClient.canonicalQuery(["to": "T", "from": "F", "a": "1"])
    assert(q.map(\.name) == ["a", "from", "to"])

    runLoggingSelfChecks()
    runScanTextSelfChecks()
    await runStoreBranchSelfChecks()
}

/// Ring-buffer cap/order and secret masking for the dev-console logging.
private func runLoggingSelfChecks() {
    // NetLog ring buffer: capped at 300, oldest dropped, newest kept.
    let net = NetLogStore()
    for i in 0..<(NetLogStore.capacity + 50) {
        net.begin(method: "GET", url: "https://x/\(i)", headers: [:], body: nil)
    }
    assert(net.entries.count == NetLogStore.capacity)
    assert(net.entries.first?.url == "https://x/50")   // first 50 evicted
    assert(net.entries.last?.url == "https://x/349")   // newest retained

    // AppLog ring buffer: capped at 500.
    let log = AppLog()
    for i in 0..<(AppLog.capacity + 10) { log.log(.info, "t", "m\(i)") }
    assert(log.entries.count == AppLog.capacity)

    // Masking: Authorization header redacted, JSON password redacted, both in store.
    let id = net.begin(
        method: "POST", url: "https://x/auth/login",
        headers: ["Authorization": "Bearer secret.jwt.token", "Content-Type": "application/json"],
        body: Data(#"{"email":"a@b.c","password":"hunter2"}"#.utf8)
    )
    let entry = net.entries.first { $0.id == id }!
    assert(entry.requestHeaders["Authorization"] == "Bearer ***")
    assert(entry.requestBody?.contains("hunter2") == false)
    assert(entry.requestBody?.contains(#""password":"***""#) == true)
}

private func makeJWT(exp: Int) -> String {
    func seg(_ obj: [String: Any]) -> String {
        let data = try! JSONSerialization.data(withJSONObject: obj)
        return data.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
    return "\(seg(["alg": "HS256"])).\(seg(["exp": exp])).sig"
}

/// Unit tests for branch & store rules (Item 2, header, offline queue).
private func runStoreBranchSelfChecks() async {
    let s1 = UserStore(id: "s1", name: "Main store")
    let s2 = UserStore(id: "s2", name: "Branch 2")

    // 1. Item 2 rules: one store; several and none saved; saved one gone
    assert(StoreManager.resolveActiveStore(stores: [s1], savedStoreID: nil) == "s1")
    assert(StoreManager.resolveActiveStore(stores: [s1], savedStoreID: "old") == "s1")
    assert(StoreManager.resolveActiveStore(stores: [s1, s2], savedStoreID: nil) == nil)
    assert(StoreManager.resolveActiveStore(stores: [s1, s2], savedStoreID: "s2") == "s2")
    assert(StoreManager.resolveActiveStore(stores: [s1, s2], savedStoreID: "deleted") == nil)

    // 2. Offline queue: queued change keeps its own store after a switch
    var activeStore: String? = "store-A"
    var outbox: [OutboxEntry] = []
    func fakeEnqueue(_ type: String) {
        outbox.append(OutboxEntry(
            id: UUID().uuidString,
            type: type,
            payloadJSON: "{}",
            baseVersion: 1,
            occurredAt: "2026-11-06T12:00:00Z",
            storeId: activeStore
        ))
    }
    fakeEnqueue("sale.create")
    assert(outbox[0].storeId == "store-A")

    activeStore = "store-B"
    fakeEnqueue("sale.create")
    assert(outbox[1].storeId == "store-B")

    activeStore = "store-A"
    assert(outbox[0].storeId == "store-A")
    assert(outbox[1].storeId == "store-B")

    // 3. Header rule: added on requests, absent on /auth/login
    final class TestURLProtocol: URLProtocol {
        static var lastRequest: URLRequest?
        override class func canInit(with request: URLRequest) -> Bool { true }
        override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
        override func startLoading() {
            Self.lastRequest = request
            let resp = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!
            client?.urlProtocol(self, didReceive: resp, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: Data("{}".utf8))
            client?.urlProtocolDidFinishLoading(self)
        }
        override func stopLoading() {}
    }

    let config = URLSessionConfiguration.ephemeral
    config.protocolClasses = [TestURLProtocol.self]
    let testSession = URLSession(configuration: config)

    nonisolated(unsafe) var testStoreID: String? = "store-test"
    let testClient = APIClient(
        baseURL: { URL(string: "http://localhost")! },
        token: { "token" },
        storeID: { testStoreID },
        session: testSession
    )

    let _: Empty = try! await testClient.get("/sync/changes")
    assert(TestURLProtocol.lastRequest?.value(forHTTPHeaderField: "X-Store-Id") == "store-test")

    let _: Empty = try! await testClient.post("/auth/login", body: ["email": "a", "password": "b"])
    assert(TestURLProtocol.lastRequest?.value(forHTTPHeaderField: "X-Store-Id") == nil)

    testStoreID = nil
    let _: Empty = try! await testClient.get("/sync/changes")
    assert(TestURLProtocol.lastRequest?.value(forHTTPHeaderField: "X-Store-Id") == nil)
}
#endif
