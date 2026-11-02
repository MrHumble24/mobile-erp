import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/sync/connectivity.dart';
import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../../auth/application/permissions.dart';
import '../application/expenses_providers.dart';
import '../data/expense_models.dart';
import '../data/expenses_repository.dart';
import 'widgets/expense_categories_dialog.dart';
import 'widgets/expense_filters.dart';
import 'widgets/expenses_summary_card.dart';
import 'widgets/expenses_table.dart';
import 'widgets/new_expense_dialog.dart';

/// Shop expenses: summary card + filters + table, with log-expense and
/// manage-categories actions (both online-only, gated by `expense.manage`).
class ExpensesScreen extends ConsumerWidget {
  const ExpensesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final can = ref.watch(canProvider);
    final page = ref.watch(expensesProvider);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => invalidateExpenses(ref),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    context.t('expenses.title'),
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                ),
                OutlinedButton.icon(
                  icon: const Icon(Icons.category_outlined, size: 18),
                  label: Text(context.t('expenses.categories')),
                  onPressed: () => showDialog<void>(
                    context: context,
                    builder: (_) => ExpenseCategoriesDialog(
                      canManage: can('expense.category.manage'),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const ExpensesSummaryCard(),
            const SizedBox(height: 16),
            const ExpenseFilters(),
            const SizedBox(height: 16),
            page.when(
              loading: () => const Padding(
                padding: EdgeInsets.all(32),
                child: Loading(),
              ),
              error: (e, _) => ErrorView(
                message: '$e',
                onRetry: () => ref.invalidate(expensesProvider),
                retryLabel: context.t('common.retry'),
              ),
              data: (data) => ExpensesTable(
                expenses: data.items,
                onDelete: (e) => _confirmDelete(context, ref, e),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: can('expense.manage')
          ? FloatingActionButton.extended(
              onPressed: () => showDialog<void>(
                context: context,
                builder: (_) => const NewExpenseDialog(),
              ),
              icon: const Icon(Icons.add),
              label: Text(context.t('expenses.newExpense')),
            )
          : null,
    );
  }

  Future<void> _confirmDelete(
    BuildContext context,
    WidgetRef ref,
    Expense expense,
  ) async {
    final ok = await showAppDialog(
      context,
      title: context.t('expenses.deleteExpense'),
      message: expense.categoryName,
      confirmLabel: context.t('common.delete'),
      cancelLabel: context.t('common.cancel'),
      destructive: true,
    );
    if (ok != true) return;
    final online = ref.read(connectivityProvider).valueOrNull ?? true;
    if (!online) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.t('common.offline'))),
        );
      }
      return;
    }
    try {
      await ref.read(expensesRepositoryProvider).remove(expense.id);
      invalidateExpenses(ref);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.t('expenses.expenseDeleted'))),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }
}
