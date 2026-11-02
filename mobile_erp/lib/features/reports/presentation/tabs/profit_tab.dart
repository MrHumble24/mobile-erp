import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../../shared/ui/ui.dart';
import '../../../../theme/tokens.dart';
import '../../application/reports_providers.dart';
import '../../data/report_models.dart';
import '../widgets/date_field.dart';
import '../widgets/metric_tile.dart';
import '../widgets/report_bar_chart.dart';

/// Profit & Loss tab: date range → KPI tiles + a revenue/cost/profit bar chart.
class ProfitTab extends ConsumerStatefulWidget {
  const ProfitTab({super.key});

  @override
  ConsumerState<ProfitTab> createState() => _ProfitTabState();
}

class _ProfitTabState extends ConsumerState<ProfitTab> {
  late DateTime _from = DateTime(DateTime.now().year, DateTime.now().month, 1);
  late DateTime _to = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final report = ref.watch(profitReportProvider((from: _from, to: _to)));

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            DateField(
              label: context.t('reports.dateFrom'),
              value: _from,
              onChanged: (d) => setState(() => _from = d),
            ),
            DateField(
              label: context.t('reports.dateTo'),
              value: _to,
              onChanged: (d) => setState(() => _to = d),
            ),
          ],
        ),
        const SizedBox(height: 16),
        report.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(32),
            child: Loading(),
          ),
          error: (e, _) => ErrorView(
            message: '$e',
            onRetry: () =>
                ref.invalidate(profitReportProvider((from: _from, to: _to))),
            retryLabel: context.t('common.retry'),
          ),
          data: (r) => _ProfitBody(report: r),
        ),
      ],
    );
  }
}

class _ProfitBody extends StatelessWidget {
  const _ProfitBody({required this.report});

  final ProfitReport report;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        MetricGrid(
          tiles: [
            MetricTile(
              label: context.t('dashboard.revenue'),
              value: formatMoney(report.revenue.toString()),
              subtext:
                  '${context.t('dashboard.retail')}: ${formatMoney(report.retail.toString())}',
            ),
            MetricTile(
              label: context.t('dashboard.cogs'),
              value: formatMoney(report.cogs.toString()),
              subtext: '${report.unitsSold} ${context.t('dashboard.unitsSold')}',
            ),
            MetricTile(
              label: context.t('dashboard.grossProfit'),
              value: formatMoney(report.grossProfit.toString()),
            ),
            MetricTile(
              label: context.t('dashboard.expenses'),
              value: formatMoney(report.expenses.toString()),
              emphasis: AppColors.danger,
            ),
            MetricTile(
              label: context.t('dashboard.netOperatingIncome'),
              value: formatMoney(report.netOperatingIncome.toString()),
              emphasis: AppColors.success,
            ),
          ],
        ),
        const SizedBox(height: 16),
        ReportBarChart(
          title: context.t('dashboard.byChannel'),
          data: [
            (label: context.t('dashboard.retail'), value: report.retail.toDouble()),
            (label: context.t('dashboard.b2b'), value: report.b2b.toDouble()),
            (
              label: context.t('dashboard.grossProfit'),
              value: report.grossProfit.toDouble()
            ),
            (
              label: context.t('dashboard.netOperatingIncome'),
              value: report.netOperatingIncome.toDouble()
            ),
          ],
        ),
      ],
    );
  }
}
