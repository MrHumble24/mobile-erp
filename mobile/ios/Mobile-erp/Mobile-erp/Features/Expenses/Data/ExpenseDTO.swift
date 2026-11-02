import Foundation

/// Expense slice DTOs. Money (`amount`) stays a Decimal **string** — render it
/// with `MoneyText`, never parse as Double. `incurredAt` is an ISO timestamp.

struct ExpenseCategory: Decodable, Identifiable, Hashable {
    let id: String
    let name: String
    let description: String?
    let sortOrder: Int
    let isActive: Bool
}

struct Expense: Decodable, Identifiable {
    let id: String
    let categoryId: String
    let category: Ref?
    let amount: String
    let description: String?
    let isRecurring: Bool
    let incurredAt: String

    struct Ref: Decodable { let name: String }

    var categoryName: String { category?.name ?? "" }
}

struct ExpenseSummaryRow: Decodable, Identifiable {
    let categoryId: String
    let name: String
    let total: Double
    var id: String { categoryId }
}

struct ExpenseSummary: Decodable {
    let total: Double
    let byCategory: [ExpenseSummaryRow]

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        total = (try? c.decode(Double.self, forKey: .total)) ?? 0
        byCategory = (try? c.decode([ExpenseSummaryRow].self, forKey: .byCategory)) ?? []
    }
    private enum CodingKeys: String, CodingKey { case total, byCategory }
}

struct ExpensePage: Decodable {
    let items: [Expense]
    let total: Int
}

/// Create payload — synthesized `Encodable` omits nil optionals, satisfying the
/// server's `forbidNonWhitelisted`.
struct CreateExpenseDto: Encodable {
    let categoryId: String
    let amount: Double
    let description: String?
    let isRecurring: Bool
    let incurredAt: String?
}

struct CreateExpenseCategoryDto: Encodable {
    let name: String
    let description: String?
}

/// `dd.MM.yyyy` for an ISO timestamp string; echoes the raw input on failure.
enum ExpenseDate {
    static func display(_ iso: String) -> String {
        guard let date = parse(iso) else { return iso }
        return out.string(from: date)
    }
    private static func parse(_ iso: String) -> Date? {
        isoFull.date(from: iso) ?? isoPlain.date(from: iso)
    }
    private static let isoFull: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]; return f
    }()
    private static let isoPlain = ISO8601DateFormatter()
    private static let out: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "dd.MM.yyyy"; return f
    }()
}
