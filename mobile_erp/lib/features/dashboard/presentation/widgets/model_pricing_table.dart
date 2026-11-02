import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../../shared/ui/ui.dart';
import '../../../auth/application/permissions.dart';
import '../../application/dashboard_providers.dart';
import '../../data/dashboard_models.dart';

/// Model pricing & margins table (`/reports/model-pricing`, perm `report.finance`).
/// Acquisition cost column needs `device.cost.view`.
class ModelPricingTable extends ConsumerWidget {
  const ModelPricingTable({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pricing = ref.watch(dashModelPricingProvider);
    final labels = ref.watch(dashModelLabelsProvider).valueOrNull ?? const {};
    final canCost = ref.watch(canProvider)('device.cost.view');

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(context.t('dashboard.modelPricingTitle'),
              style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 12),
          pricing.when(
            loading: () => const Loading(),
            error: (e, _) => ErrorView(message: '$e'),
            data: (rows) => rows.isEmpty
                ? EmptyView(message: context.t('dashboard.modelPricingTitle'))
                : AppDataTable<DashModelPricingRow>(
                    columns: [
                      context.t('inventory.model'),
                      context.t('inventory.storage'),
                      if (canCost) context.t('dashboard.avgAcquisitionCost'),
                      context.t('dashboard.avgSellingPrice'),
                      context.t('dashboard.unitsInStock'),
                      context.t('dashboard.unitsSold'),
                    ],
                    rows: rows,
                    cells: (r) => [
                      Text(labels[r.modelId] ?? r.modelId),
                      Text(r.storage ?? '—'),
                      if (canCost) Text(_money(r.avgAcquisitionCost)),
                      Text(_money(r.avgSellingPrice)),
                      Text('${r.unitsInStock}'),
                      Text('${r.unitsSold}'),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  String _money(num? value) =>
      value == null ? '—' : formatMoney(value.toString());
}
