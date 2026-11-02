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

struct ExpenseUserRef: Decodable {
    let email: String
    let profile: Profile?
    struct Profile: Decodable { let firstName: String; let lastName: String? }

    var displayName: String {
        guard let profile else { return email }
        let full = [profile.firstName, profile.lastName].compactMap { $0 }
            .joined(separator: " ").trimmingCharacters(in: .whitespaces)
        return full.isEmpty ? email : full
    }
}

struct Expense: Decodable, Identifiable {
    let id: String
    let categoryId: String
    let category: Ref?
    let amount: String
    let description: String?
    let vendor: String?
    let isRecurring: Bool
    let recurrenceId: String?
    let incurredAt: String
    let createdBy: ExpenseUserRef?

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
    let previousTotal: Double
    let count: Int
    let byCategory: [ExpenseSummaryRow]
    let topCategory: ExpenseSummaryRow?

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        total = (try? c.decode(Double.self, forKey: .total)) ?? 0
        previousTotal = (try? c.decode(Double.self, forKey: .previousTotal)) ?? 0
        count = (try? c.decode(Int.self, forKey: .count)) ?? 0
        byCategory = (try? c.decode([ExpenseSummaryRow].self, forKey: .byCategory)) ?? []
        topCategory = try? c.decode(ExpenseSummaryRow.self, forKey: .topCategory)
    }
    private enum CodingKeys: String, CodingKey {
        case total, previousTotal, count, byCategory, topCategory
    }
}

struct ExpensePage: Decodable {
    let items: [Expense]
    let total: Int
}

/// Create/update payloads — synthesized `Encodable` omits nil optionals,
/// satisfying the server's `forbidNonWhitelisted`.
struct CreateExpenseDto: Encodable {
    let categoryId: String
    let amount: Double
    let description: String?
    let vendor: String?
    let isRecurring: Bool
    let incurredAt: String?
}

struct UpdateExpenseDto: Encodable {
    let categoryId: String
    let amount: Double
    let description: String?
    let vendor: String?
    let isRecurring: Bool
    let incurredAt: String?
}

struct CreateExpenseCategoryDto: Encodable {
    let name: String
    let description: String?
}

/// Category edit: rename, reorder, (de)activate and — when deactivating a
/// category that still has expenses — reassign them via `reassignToId`.
struct UpdateExpenseCategoryDto: Encodable {
    let name: String?
    let description: String?
    let sortOrder: Int?
    let isActive: Bool?
    let reassignToId: String?
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
