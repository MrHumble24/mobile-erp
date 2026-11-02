import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../../shared/ui/ui.dart';
import '../../application/reports_providers.dart';
import '../../data/report_models.dart';
import '../widgets/date_field.dart';
import '../widgets/metric_tile.dart';
import '../widgets/report_bar_chart.dart';

/// Daily register closing: pick a date → that day's units, revenue, profit,
/// expenses and consignment movement.
class DailyClosingTab extends ConsumerStatefulWidget {
  const DailyClosingTab({super.key});

  @override
  ConsumerState<DailyClosingTab> createState() => _DailyClosingTabState();
}

class _DailyClosingTabState extends ConsumerState<DailyClosingTab> {
  DateTime _date = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final report = ref.watch(dailyClosingProvider(_date));

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        DateField(
          label: context.t('reports.selectDate'),
          value: _date,
          onChanged: (d) => setState(() => _date = d),
        ),
        const SizedBox(height: 16),
        report.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(32),
            child: Loading(),
          ),
          error: (e, _) => ErrorView(message: '$e'),
          data: (r) => _ClosingBody(report: r),
        ),
      ],
    );
  }
}

class _ClosingBody extends StatelessWidget {
  const _ClosingBody({required this.report});

  final DailyClosingReport report;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        MetricGrid(
          tiles: [
            MetricTile(
              label: context.t('dashboard.revenue'),
              value: formatMoney(report.revenue.toString()),
              subtext: '${report.unitsSold} ${context.t('dashboard.unitsSold')}',
            ),
            MetricTile(
              label: context.t('dashboard.grossProfit'),
              value: formatMoney(report.grossProfit.toString()),
            ),
            MetricTile(
              label: context.t('dashboard.expenses'),
              value: formatMoney(report.expenses.toString()),
            ),
            MetricTile(
              label: context.t('nav.consignments'),
              value: '+${report.newConsignments} / -${report.settledConsignments}',
            ),
          ],
        ),
        const SizedBox(height: 16),
        ReportBarChart(
          title: context.t('reports.closingReport'),
          data: [
            (label: context.t('dashboard.revenue'), value: report.revenue.toDouble()),
            (
              label: context.t('dashboard.grossProfit'),
              value: report.grossProfit.toDouble()
            ),
            (
              label: context.t('dashboard.expenses'),
              value: report.expenses.toDouble()
            ),
          ],
        ),
      ],
    );
  }
}
