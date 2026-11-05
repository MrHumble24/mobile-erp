import Foundation

/// Ledger slice DTOs. Money stays a Decimal **string** for `MoneyText`; never a
/// Double. `/ledger/balances` sends `balance`/`total` as a JSON number today and
/// as a decimal string after an in-progress server change — both decode to a
/// normalized string here (`BalanceDecimal`).

/// Decodes a money field that may arrive as a JSON number or a decimal string.
enum BalanceDecimal {
    static func decode<K: CodingKey>(_ c: KeyedDecodingContainer<K>, _ key: K) -> String {
        if let s = try? c.decode(String.self, forKey: key) { return s }
        if let d = try? c.decode(Decimal.self, forKey: key) {
            return NSDecimalNumber(decimal: d).stringValue
        }
        return "0"
    }
}

struct BalanceAccount: Decodable, Identifiable {
    let accountCode: String
    let label: String
    let balance: String

    var id: String { accountCode }

    private enum CodingKeys: String, CodingKey { case accountCode, label, balance }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        accountCode = try c.decode(String.self, forKey: .accountCode)
        label = (try? c.decode(String.self, forKey: .label)) ?? accountCode
        balance = BalanceDecimal.decode(c, .balance)
    }
}

struct BalanceSummary: Decodable {
    let accounts: [BalanceAccount]
    let total: String

    private enum CodingKeys: String, CodingKey { case accounts, total }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        accounts = (try? c.decode([BalanceAccount].self, forKey: .accounts)) ?? []
        total = BalanceDecimal.decode(c, .total)
    }
}

struct BalanceRef: Decodable { let code: String; let label: String }

struct BalanceUserRef: Decodable {
    let email: String?
    let profile: Profile?
    struct Profile: Decodable { let firstName: String?; let lastName: String? }

    var displayName: String {
        let full = [profile?.firstName, profile?.lastName].compactMap { $0 }
            .joined(separator: " ").trimmingCharacters(in: .whitespaces)
        if !full.isEmpty { return full }
        return email ?? ""
    }
}

/// One ledger movement. `amount` is a signed decimal string, or **nil** when the
/// server redacts a cost-type row's amount from a caller without
/// `device.cost.view` (ADR 0028). `account`/`type` carry the server-sent label
/// used when a code is unknown to the app.
struct BalanceTransaction: Decodable, Identifiable {
    let id: String
    let accountCode: String
    let typeCode: String
    let amount: String?
    let occurredAt: String
    let note: String?
    let transferId: String?
    let account: BalanceRef?
    let type: BalanceRef?
    let createdBy: BalanceUserRef?
}

struct BalanceTransactionPage: Decodable {
    let items: [BalanceTransaction]
    let total: Int
}

/// Create payloads — synthesized `Encodable` omits nil optionals (`encodeIfPresent`),
/// satisfying the server's `forbidNonWhitelisted`.
struct CreateLedgerTransactionDto: Encodable {
    let accountCode: String
    let typeCode: String
    let amount: Double
    let note: String?
    let occurredAt: String?
}

struct CreateLedgerTransferDto: Encodable {
    let fromAccountCode: String
    let toAccountCode: String
    let amount: Double
    let note: String?
}
