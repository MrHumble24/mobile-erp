import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../../shared/ui/ui.dart';
import '../../../../theme/tokens.dart';
import '../../application/dashboard_providers.dart';
import '../../data/dashboard_models.dart';

/// Revenue / profit KPI tiles with a today/week/month toggle (`/reports/profit`).
class KpiSection extends ConsumerStatefulWidget {
  const KpiSection({super.key});

  @override
  ConsumerState<KpiSection> createState() => _KpiSectionState();
}

class _KpiSectionState extends ConsumerState<KpiSection> {
  DashPeriod _period = DashPeriod.today;

  @override
  Widget build(BuildContext context) {
    final profit = ref.watch(dashProfitProvider(_period));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SegmentedButton<DashPeriod>(
          segments: [
            ButtonSegment(
                value: DashPeriod.today,
                label: Text(context.t('dashboard.periodToday'))),
            ButtonSegment(
                value: DashPeriod.week,
                label: Text(context.t('dashboard.periodWeek'))),
            ButtonSegment(
                value: DashPeriod.month,
                label: Text(context.t('dashboard.periodMonth'))),
          ],
          selected: {_period},
          onSelectionChanged: (s) => setState(() => _period = s.first),
        ),
        const SizedBox(height: 12),
        profit.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(24),
            child: Loading(),
          ),
          error: (e, _) => ErrorView(
            message: '$e',
            onRetry: () => ref.invalidate(dashProfitProvider(_period)),
            retryLabel: context.t('common.retry'),
          ),
          data: (p) => _KpiTiles(profit: p),
        ),
      ],
    );
  }
}

class _KpiTiles extends StatelessWidget {
  const _KpiTiles({required this.profit});

  final DashProfit profit;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final perRow = width >= 900 ? 4 : 2;
    final tileWidth = (width - 32 - (perRow - 1) * 12) / perRow;
    final tiles = [
      _KpiTile(
        label: context.t('dashboard.grossProfit'),
        value: formatMoney(profit.grossProfit.toString()),
        subtext: '${profit.unitsSold} ${context.t('dashboard.unitsSold')}',
      ),
      _KpiTile(
        label: context.t('dashboard.netOperatingIncome'),
        value: formatMoney(profit.netOperatingIncome.toString()),
        emphasis: AppColors.success,
      ),
      _KpiTile(
        label: context.t('dashboard.revenue'),
        value: formatMoney(profit.revenue.toString()),
        subtext:
            '${context.t('dashboard.retail')}: ${formatMoney(profit.retail.toString())}',
      ),
      _KpiTile(
        label: context.t('dashboard.expenses'),
        value: formatMoney(profit.expenses.toString()),
        emphasis: AppColors.danger,
      ),
    ];
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        for (final tile in tiles)
          SizedBox(width: tileWidth.clamp(140, 320).toDouble(), child: tile),
      ],
    );
  }
}

class _KpiTile extends StatelessWidget {
  const _KpiTile({
    required this.label,
    required this.value,
    this.subtext,
    this.emphasis,
  });

  final String label;
  final String value;
  final String? subtext;
  final Color? emphasis;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final muted = Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6);
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: text.labelMedium?.copyWith(color: muted)),
          const SizedBox(height: 6),
          Text(value, style: text.titleLarge?.copyWith(color: emphasis)),
          if (subtext != null) ...[
            const SizedBox(height: 4),
            Text(subtext!, style: text.bodySmall?.copyWith(color: muted)),
          ],
        ],
      ),
    );
  }
}
