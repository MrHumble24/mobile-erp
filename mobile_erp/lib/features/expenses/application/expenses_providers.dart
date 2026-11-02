import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/expense_categories_repository.dart';
import '../data/expense_models.dart';
import '../data/expenses_repository.dart';

/// The active list filter (client-only state). Screens mutate it; the list and
/// summary providers rebuild off it.
class ExpenseFilterNotifier extends Notifier<ExpenseFilter> {
  @override
  ExpenseFilter build() => const ExpenseFilter();

  void setCategory(String? categoryId) =>
      state = state.copyWith(categoryId: categoryId);

  void setRecurring(bool? isRecurring) =>
      state = state.copyWith(isRecurring: isRecurring);
}

final expenseFilterProvider =
    NotifierProvider<ExpenseFilterNotifier, ExpenseFilter>(
  ExpenseFilterNotifier.new,
);

final expensesProvider = FutureProvider.autoDispose<ExpensePage>((ref) {
  final filter = ref.watch(expenseFilterProvider);
  return ref.watch(expensesRepositoryProvider).list(filter);
});

final expenseSummaryProvider =
    FutureProvider.autoDispose<ExpenseSummary>((ref) {
  return ref.watch(expensesRepositoryProvider).summary();
});

final expenseCategoriesProvider =
    FutureProvider<List<ExpenseCategory>>((ref) {
  return ref.watch(expenseCategoriesRepositoryProvider).list();
});

/// Invalidate every expense read after a write so lists + summary refetch.
void invalidateExpenses(WidgetRef ref) {
  ref.invalidate(expensesProvider);
  ref.invalidate(expenseSummaryProvider);
}
