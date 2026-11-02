import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import '../../auth/application/permissions.dart';
import 'widgets/kpi_section.dart';
import 'widgets/low_stock_table.dart';
import 'widgets/model_pricing_table.dart';
import 'widgets/overdue_table.dart';
import 'widgets/quick_actions.dart';

/// Management dashboard (route `/dashboard`, auth-only). Each data section is
/// gated by the permission its endpoint needs, so a cashier sees only its
/// quick actions, not the finance KPIs.
class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final can = ref.watch(canProvider);
    final wide = MediaQuery.sizeOf(context).width >= 800;

    final tables = <Widget>[
      if (can('device.read')) const LowStockTable(),
      if (can('consignment.read')) const OverdueTable(),
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(context.t('dashboard.title'),
            style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 16),
        const QuickActions(),
        const SizedBox(height: 16),
        if (can('report.finance')) ...[
          const KpiSection(),
          const SizedBox(height: 16),
        ],
        if (tables.isNotEmpty) ...[
          if (wide)
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (var i = 0; i < tables.length; i++) ...[
                  if (i > 0) const SizedBox(width: 16),
                  Expanded(child: tables[i]),
                ],
              ],
            )
          else
            for (final table in tables) ...[
              table,
              const SizedBox(height: 16),
            ],
          const SizedBox(height: 16),
        ],
        if (can('report.finance')) const ModelPricingTable(),
      ],
    );
  }
}
