import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../../shared/ui/ui.dart';
import '../../application/expenses_providers.dart';

/// Total-expenses card with a per-category breakdown (`/expenses/summary`).
class ExpensesSummaryCard extends ConsumerWidget {
  const ExpensesSummaryCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(expenseSummaryProvider);
    final text = Theme.of(context).textTheme;

    return summary.when(
      loading: () => const AppCard(child: Loading()),
      error: (e, _) => AppCard(child: ErrorView(message: '$e')),
      data: (data) => AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(context.t('expenses.summaryTitle'), style: text.labelLarge),
            const SizedBox(height: 4),
            Text(
              formatMoney(data.total.toString()),
              style: text.headlineSmall,
            ),
            const SizedBox(height: 12),
            for (final row in data.byCategory)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(row.name, style: text.bodyMedium),
                    Text(
                      formatMoney(row.total.toString()),
                      style: text.bodyMedium,
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
