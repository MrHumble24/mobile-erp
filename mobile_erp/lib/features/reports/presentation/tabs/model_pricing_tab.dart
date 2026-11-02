import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../../shared/ui/ui.dart';
import '../../../auth/application/permissions.dart';
import '../../application/reports_providers.dart';
import '../../data/report_models.dart';
import '../widgets/report_bar_chart.dart';

/// Model pricing & margins over a rolling 90-day window. Acquisition cost is
/// shown only to users with `device.cost.view`; it is null (→ "—") otherwise.
class ModelPricingTab extends ConsumerWidget {
  const ModelPricingTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pricing = ref.watch(modelPricingProvider);
    final labels = ref.watch(deviceModelLabelsProvider).valueOrNull ?? const {};
    final canCost = ref.watch(canProvider)('device.cost.view');

    String name(ModelPricingRow r) => labels[r.modelId] ?? r.modelId;

    return pricing.when(
      loading: () => const Padding(padding: EdgeInsets.all(32), child: Loading()),
      error: (e, _) => ErrorView(
        message: '$e',
        onRetry: () => ref.invalidate(modelPricingProvider),
        retryLabel: context.t('common.retry'),
      ),
      data: (rows) {
        if (rows.isEmpty) {
          return EmptyView(message: context.t('expenses.noExpensesFound'));
        }
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            ReportBarChart(
              title: context.t('dashboard.avgSellingPrice'),
              data: [
                for (final r in rows.take(8))
                  (
                    label: name(r),
                    value: (r.avgSellingPrice ?? 0).toDouble(),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            AppDataTable<ModelPricingRow>(
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
                Text(name(r)),
                Text(r.storage ?? '—'),
                if (canCost) Text(_money(r.avgAcquisitionCost)),
                Text(_money(r.avgSellingPrice)),
                Text('${r.unitsInStock}'),
                Text('${r.unitsSold}'),
              ],
            ),
          ],
        );
      },
    );
  }

  String _money(num? value) =>
      value == null ? '—' : formatMoney(value.toString());
}
