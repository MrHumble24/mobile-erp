import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/i18n.dart';
import '../../../../shared/ui/ui.dart';
import '../../../../theme/tokens.dart';
import '../../application/dashboard_providers.dart';
import '../../data/dashboard_models.dart';

/// Low-stock alerts table (`/stock-alert-rules/low-stock`, perm `device.read`).
class LowStockTable extends ConsumerWidget {
  const LowStockTable({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lowStock = ref.watch(dashLowStockProvider);
    final labels = ref.watch(dashModelLabelsProvider).valueOrNull ?? const {};

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(context.t('dashboard.lowStockTitle'),
              style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 12),
          lowStock.when(
            loading: () => const Loading(),
            error: (e, _) => ErrorView(message: '$e'),
            data: (rows) => rows.isEmpty
                ? EmptyView(message: context.t('dashboard.lowStockTitle'))
                : AppDataTable<LowStockItem>(
                    columns: [
                      context.t('inventory.model'),
                      context.t('inventory.storage'),
                      context.t('dashboard.currentCount'),
                      context.t('dashboard.threshold'),
                    ],
                    rows: rows,
                    cells: (r) => [
                      Text(labels[r.modelId] ?? r.modelId),
                      Text(r.storage),
                      StatusChip('${r.currentCount}', color: AppColors.danger),
                      Text('${r.threshold}'),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
