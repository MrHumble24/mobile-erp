import 'package:flutter/material.dart';

import '../../../l10n/i18n.dart';
import 'tabs/daily_closing_tab.dart';
import 'tabs/expenses_report_tab.dart';
import 'tabs/model_pricing_tab.dart';
import 'tabs/profit_tab.dart';

/// Financial reports: Profit / Expenses / Model pricing / Daily closing tabs.
/// Renders inside the shell's Scaffold, so it adds no AppBar of its own.
class ReportsScreen extends StatelessWidget {
  const ReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return DefaultTabController(
      length: 4,
      child: Column(
        children: [
          Material(
            color: scheme.surface,
            child: TabBar(
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              tabs: [
                Tab(text: context.t('reports.tabProfit')),
                Tab(text: context.t('reports.tabExpenses')),
                Tab(text: context.t('reports.tabModelPricing')),
                Tab(text: context.t('reports.tabDailyClosing')),
              ],
            ),
          ),
          const Divider(height: 1),
          const Expanded(
            child: TabBarView(
              children: [
                ProfitTab(),
                ExpensesReportTab(),
                ModelPricingTab(),
                DailyClosingTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
