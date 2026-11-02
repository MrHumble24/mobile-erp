import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../l10n/i18n.dart';
import '../../../auth/application/permissions.dart';

/// Cross-feature quick actions. Links out with `context.go` (no slice import).
class QuickActions extends ConsumerWidget {
  const QuickActions({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final can = ref.watch(canProvider);
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        if (can('sale.create'))
          FilledButton.icon(
            onPressed: () => context.go('/pos'),
            icon: const Icon(Icons.shopping_cart_outlined),
            label: Text(context.t('nav.pos')),
          ),
        if (can('expense.read'))
          OutlinedButton.icon(
            onPressed: () => context.go('/expenses'),
            icon: const Icon(Icons.receipt_long_outlined),
            label: Text(context.t('nav.expenses')),
          ),
      ],
    );
  }
}
