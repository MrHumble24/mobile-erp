import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../../../theme/tokens.dart';
import '../../auth/application/permissions.dart';
import '../../device_models/device_models_module.dart';
import '../application/stock_alerts_providers.dart';
import '../data/stock_alert.dart';
import 'alert_rule_form.dart';

/// Alerts tab of the inventory page: low-stock list + alert-rule management.
/// Rule writes are gated on `settings.manage`.
class StockAlertsTab extends ConsumerWidget {
  const StockAlertsTab({super.key});

  String _nameOf(List<DeviceModelView> models, String modelId) {
    final match = models.where((m) => m.id == modelId);
    return match.isEmpty ? modelId : match.first.label;
  }

  Future<void> _openForm(
    BuildContext context,
    WidgetRef ref, [
    StockAlertRuleView? rule,
  ]) async {
    await showAppBottomSheet<bool>(
      context,
      builder: (_) => AlertRuleForm(rule: rule),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canManage = ref.watch(canProvider)('settings.manage');
    final lowStock = ref.watch(lowStockProvider).valueOrNull ?? const [];
    final rules = ref.watch(stockAlertRulesProvider);
    final models = ref.watch(deviceModelsProvider).valueOrNull ?? const [];

    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 12),
      children: [
        if (lowStock.isNotEmpty) ...[
          _LowStockSection(
            rows: lowStock,
            nameOf: (id) => _nameOf(models, id),
          ),
          const SizedBox(height: 16),
        ],
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(context.t('inventory.rulesTitle'),
                style: Theme.of(context).textTheme.labelLarge),
            if (canManage)
              FilledButton.icon(
                onPressed: () => _openForm(context, ref),
                icon: const Icon(Icons.add, size: 18),
                label: Text(context.t('inventory.newRule')),
              ),
          ],
        ),
        const SizedBox(height: 8),
        rules.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(24),
            child: Loading(),
          ),
          error: (e, _) => ErrorView(
            message: e.toString(),
            onRetry: () => ref.invalidate(stockAlertRulesProvider),
            retryLabel: context.t('common.retry'),
          ),
          data: (list) => list.isEmpty
              ? EmptyView(message: context.t('inventory.empty'))
              : Column(
                  children: [
                    for (final r in list)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: AppCard(
                          onTap: canManage
                              ? () => _openForm(context, ref, r)
                              : null,
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  '${_nameOf(models, r.modelId)} · ${r.storage}',
                                  style:
                                      Theme.of(context).textTheme.bodyMedium,
                                ),
                              ),
                              Text(
                                '${r.threshold}',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium,
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
        ),
      ],
    );
  }
}

class _LowStockSection extends StatelessWidget {
  const _LowStockSection({required this.rows, required this.nameOf});

  final List<LowStockView> rows;
  final String Function(String modelId) nameOf;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.warning_amber_rounded,
                size: 18, color: AppColors.danger),
            const SizedBox(width: 6),
            Text(
              context.t('inventory.lowStock'),
              style: Theme.of(context)
                  .textTheme
                  .labelLarge
                  ?.copyWith(color: AppColors.danger),
            ),
          ],
        ),
        const SizedBox(height: 8),
        for (final r in rows)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: AppCard(
              child: Row(
                children: [
                  Expanded(
                    child: Text('${nameOf(r.modelId)} · ${r.storage}',
                        style: Theme.of(context).textTheme.bodyMedium),
                  ),
                  Text(
                    '${r.currentCount} / ${r.threshold}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: r.isBelow ? AppColors.danger : null,
                        ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
