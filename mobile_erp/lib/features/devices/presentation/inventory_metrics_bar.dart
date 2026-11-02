import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import '../../../theme/tokens.dart';
import '../../stock_alerts/stock_alerts_module.dart';
import '../application/devices_providers.dart';

/// Metrics strip above the devices list. Status cards toggle the list filter;
/// the low-stock card jumps to the Alerts tab.
class InventoryMetricsBar extends ConsumerWidget {
  const InventoryMetricsBar({required this.onShowAlerts, super.key});

  final VoidCallback onShowAlerts;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final metrics = ref.watch(deviceMetricsProvider);
    final selected = ref.watch(deviceFilterProvider).statusCode;
    final lowStock = ref.watch(lowStockProvider).valueOrNull?.length;
    final filter = ref.read(deviceFilterProvider.notifier);

    final cards = <Widget>[
      _MetricCard(
        label: context.t('inventory.metricsTotal'),
        value: metrics.total,
        color: AppColors.onyx,
        active: selected == null,
        onTap: () => filter.setStatus(null),
      ),
      _MetricCard(
        label: context.t('inventory.metricsInStock'),
        value: metrics.inStock,
        color: AppColors.success,
        active: selected == 'IN_STOCK',
        onTap: () => filter.toggleStatus('IN_STOCK'),
      ),
      _MetricCard(
        label: context.t('inventory.metricsDefective'),
        value: metrics.defective,
        color: AppColors.danger,
        active: selected == 'DEFECTIVE',
        onTap: () => filter.toggleStatus('DEFECTIVE'),
      ),
      _MetricCard(
        label: context.t('inventory.metricsConsigned'),
        value: metrics.consigned,
        color: AppColors.signalBlue,
        active: selected == 'CONSIGNED',
        onTap: () => filter.toggleStatus('CONSIGNED'),
      ),
      _MetricCard(
        label: context.t('inventory.metricsLowStock'),
        value: lowStock,
        color: AppColors.warning,
        active: false,
        onTap: onShowAlerts,
      ),
    ];

    return GridView.count(
      crossAxisCount: MediaQuery.sizeOf(context).width >= 600 ? 5 : 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.8,
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      children: cards,
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.label,
    required this.value,
    required this.color,
    required this.active,
    required this.onTap,
  });

  final String label;
  final int? value;
  final Color color;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadii.cards),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(AppRadii.cards),
          border: Border.all(
            color: active ? AppColors.onyx : AppColors.bone,
            width: active ? 1.5 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.labelSmall,
                  ),
                ),
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                ),
              ],
            ),
            Text(
              value?.toString() ?? '—',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
          ],
        ),
      ),
    );
  }
}
