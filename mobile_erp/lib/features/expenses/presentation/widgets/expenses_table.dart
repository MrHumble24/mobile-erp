import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../../shared/ui/ui.dart';
import '../../../auth/application/permissions.dart';
import '../../data/expense_models.dart';

final _dateFmt = DateFormat('dd.MM.yyyy');

/// The expenses list as a data table. A delete action per row for users with
/// `expense.manage`.
class ExpensesTable extends ConsumerWidget {
  const ExpensesTable({required this.expenses, required this.onDelete, super.key});

  final List<Expense> expenses;
  final void Function(Expense) onDelete;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (expenses.isEmpty) {
      return EmptyView(message: context.t('expenses.noExpensesFound'));
    }
    final canManage = ref.watch(canProvider)('expense.manage');

    return AppDataTable<Expense>(
      columns: [
        context.t('common.date'),
        context.t('expenses.category'),
        context.t('common.amount'),
        context.t('expenses.description'),
        if (canManage) context.t('common.actions'),
      ],
      rows: expenses,
      cells: (e) => [
        Text(_dateFmt.format(e.incurredAt)),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(e.categoryName),
            if (e.isRecurring)
              Padding(
                padding: const EdgeInsets.only(left: 6),
                child: StatusChip(
                  context.t('expenses.isRecurring'),
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
          ],
        ),
        Text(formatMoney(e.amount)),
        Text(e.description ?? '—'),
        if (canManage)
          IconButton(
            tooltip: context.t('expenses.deleteExpense'),
            icon: const Icon(Icons.delete_outline),
            onPressed: () => onDelete(e),
          ),
      ],
    );
  }
}
