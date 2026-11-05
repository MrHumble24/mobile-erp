import Foundation

/// Recurring-expense templates (`/expense-recurrences`). `amount` is a Decimal
/// string; `nextDueAt` is ISO. Frequency is a fixed two-value set.
struct ExpenseRecurrence: Decodable, Identifiable {
    let id: String
    let categoryId: String
    let category: Ref?
    let amount: String
    let description: String?
    let vendor: String?
    let frequency: String
    let nextDueAt: String
    let isActive: Bool
    /// Account generated expenses post against; optional for older cached rows.
    let accountCode: String?

    struct Ref: Decodable { let name: String }
    var categoryName: String { category?.name ?? "" }
}

struct CreateExpenseRecurrenceDto: Encodable {
    let categoryId: String
    let amount: Double
    let description: String?
    let vendor: String?
    let frequency: String
    let nextDueAt: String
    let accountCode: String?
}

struct UpdateExpenseRecurrenceDto: Encodable {
    let categoryId: String?
    let amount: Double?
    let description: String?
    let vendor: String?
    let frequency: String?
    let nextDueAt: String?
    let isActive: Bool?
    let accountCode: String?
}

struct GenerateDueResult: Decodable { let generated: Int }
