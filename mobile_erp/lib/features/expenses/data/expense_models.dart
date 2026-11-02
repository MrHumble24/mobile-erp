// Domain models for the expenses slice. Money stays a Decimal-string
// (`amount`); never parse it as a double — use `parseMoney`/`formatMoney`.

class ExpenseCategory {
  const ExpenseCategory({
    required this.id,
    required this.name,
    required this.sortOrder,
    required this.isActive,
    this.description,
  });

  final String id;
  final String name;
  final String? description;
  final int sortOrder;
  final bool isActive;

  factory ExpenseCategory.fromJson(Map<String, dynamic> json) => ExpenseCategory(
        id: json['id'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
        isActive: json['isActive'] as bool? ?? true,
      );
}

class Expense {
  const Expense({
    required this.id,
    required this.categoryId,
    required this.categoryName,
    required this.amount,
    required this.isRecurring,
    required this.incurredAt,
    this.description,
  });

  final String id;
  final String categoryId;
  final String categoryName;

  /// Decimal-string, e.g. `"1250000.00"`.
  final String amount;
  final String? description;
  final bool isRecurring;
  final DateTime incurredAt;

  factory Expense.fromJson(Map<String, dynamic> json) {
    final category = json['category'] as Map?;
    return Expense(
      id: json['id'] as String,
      categoryId: json['categoryId'] as String,
      categoryName: (category?['name'] ?? '') as String,
      amount: json['amount']?.toString() ?? '0',
      description: json['description'] as String?,
      isRecurring: json['isRecurring'] as bool? ?? false,
      incurredAt:
          DateTime.tryParse(json['incurredAt']?.toString() ?? '') ??
              DateTime.now(),
    );
  }
}

class ExpenseSummaryRow {
  const ExpenseSummaryRow({
    required this.categoryId,
    required this.name,
    required this.total,
  });

  final String categoryId;
  final String name;
  final num total;

  factory ExpenseSummaryRow.fromJson(Map<String, dynamic> json) =>
      ExpenseSummaryRow(
        categoryId: json['categoryId'] as String,
        name: (json['name'] ?? '') as String,
        total: (json['total'] as num?) ?? 0,
      );
}

class ExpenseSummary {
  const ExpenseSummary({required this.total, required this.byCategory});

  final num total;
  final List<ExpenseSummaryRow> byCategory;

  factory ExpenseSummary.fromJson(Map<String, dynamic> json) => ExpenseSummary(
        total: (json['total'] as num?) ?? 0,
        byCategory: [
          for (final row in (json['byCategory'] as List? ?? const []))
            ExpenseSummaryRow.fromJson((row as Map).cast()),
        ],
      );
}

class ExpensePage {
  const ExpensePage({required this.items, required this.total});

  final List<Expense> items;
  final int total;

  factory ExpensePage.fromJson(Map<String, dynamic> json) => ExpensePage(
        items: [
          for (final item in (json['items'] as List? ?? const []))
            Expense.fromJson((item as Map).cast()),
        ],
        total: (json['total'] as num?)?.toInt() ?? 0,
      );
}

/// List filter held in the slice store; also the query params sent to the API.
class ExpenseFilter {
  const ExpenseFilter({this.categoryId, this.isRecurring});

  final String? categoryId;
  final bool? isRecurring;

  ExpenseFilter copyWith({
    Object? categoryId = _keep,
    Object? isRecurring = _keep,
  }) =>
      ExpenseFilter(
        categoryId:
            categoryId == _keep ? this.categoryId : categoryId as String?,
        isRecurring:
            isRecurring == _keep ? this.isRecurring : isRecurring as bool?,
      );

  static const _keep = Object();
}
