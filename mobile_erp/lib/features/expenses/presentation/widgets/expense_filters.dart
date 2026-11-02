import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/i18n.dart';
import '../../application/expenses_providers.dart';

/// Category + recurring filters driving [expenseFilterProvider].
class ExpenseFilters extends ConsumerWidget {
  const ExpenseFilters({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(expenseFilterProvider);
    final notifier = ref.read(expenseFilterProvider.notifier);
    final categories = ref.watch(expenseCategoriesProvider).valueOrNull ?? [];

    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        SizedBox(
          width: 220,
          child: DropdownButtonFormField<String?>(
            initialValue: filter.categoryId,
            isExpanded: true,
            decoration: InputDecoration(labelText: context.t('expenses.category')),
            items: [
              DropdownMenuItem(value: null, child: Text(context.t('common.all'))),
              for (final c in categories)
                DropdownMenuItem(value: c.id, child: Text(c.name)),
            ],
            onChanged: notifier.setCategory,
          ),
        ),
        SizedBox(
          width: 220,
          child: DropdownButtonFormField<bool?>(
            initialValue: filter.isRecurring,
            isExpanded: true,
            decoration:
                InputDecoration(labelText: context.t('expenses.filterRecurring')),
            items: [
              DropdownMenuItem(value: null, child: Text(context.t('common.all'))),
              DropdownMenuItem(
                  value: true, child: Text(context.t('common.yes'))),
              DropdownMenuItem(value: false, child: Text(context.t('common.no'))),
            ],
            onChanged: notifier.setRecurring,
          ),
        ),
      ],
    );
  }
}
