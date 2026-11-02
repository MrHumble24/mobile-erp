import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../../shared/ui/ui.dart';
import '../../application/reports_providers.dart';
import '../../data/report_models.dart';
import '../widgets/date_field.dart';
import '../widgets/report_bar_chart.dart';

/// Expense analysis tab: group by category or month → bar chart + table.
class ExpensesReportTab extends ConsumerStatefulWidget {
  const ExpensesReportTab({super.key});

  @override
  ConsumerState<ExpensesReportTab> createState() => _ExpensesReportTabState();
}

class _ExpensesReportTabState extends ConsumerState<ExpensesReportTab> {
  DateTime? _from;
  DateTime? _to;
  String _groupBy = 'category';

  @override
  Widget build(BuildContext context) {
    final rows = ref.watch(
      expenseReportProvider((from: _from, to: _to, groupBy: _groupBy)),
    );

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Wrap(
          spacing: 12,
          runSpacing: 12,
          crossAxisAlignment: WrapCrossAlignment.center,
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
            SizedBox(
              width: 200,
              child: DropdownButtonFormField<String>(
                initialValue: _groupBy,
                decoration:
                    InputDecoration(labelText: context.t('reports.groupBy')),
                items: [
                  DropdownMenuItem(
                      value: 'category',
                      child: Text(context.t('reports.groupByCategory'))),
                  DropdownMenuItem(
                      value: 'month',
                      child: Text(context.t('reports.groupByMonth'))),
                ],
                onChanged: (v) => setState(() => _groupBy = v ?? 'category'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        rows.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(32),
            child: Loading(),
          ),
          error: (e, _) => ErrorView(message: '$e'),
          data: (list) => _ExpensesReportBody(rows: list),
        ),
      ],
    );
  }
}

class _ExpensesReportBody extends StatelessWidget {
  const _ExpensesReportBody({required this.rows});

  final List<ExpenseReportRow> rows;

  @override
  Widget build(BuildContext context) {
    if (rows.isEmpty) {
      return EmptyView(message: context.t('expenses.noExpensesFound'));
    }
    final total = rows.fold<num>(0, (sum, r) => sum + r.total);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ReportBarChart(
          title: context.t('reports.tabExpenses'),
          data: [
            for (final r in rows)
              (label: r.label, value: r.total.toDouble()),
          ],
        ),
        const SizedBox(height: 16),
        AppDataTable<ExpenseReportRow>(
          columns: [context.t('expenses.category'), context.t('common.amount')],
          rows: rows,
          cells: (r) => [Text(r.label), Text(formatMoney(r.total.toString()))],
        ),
        const SizedBox(height: 12),
        Align(
          alignment: Alignment.centerRight,
          child: Text(
            '${context.t('common.total')}: ${formatMoney(total.toString())}',
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ),
      ],
    );
  }
}
