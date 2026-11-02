import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../../shared/ui/ui.dart';
import '../../../../theme/tokens.dart';
import '../../application/dashboard_providers.dart';
import '../../data/dashboard_models.dart';

final _dateFmt = DateFormat('dd.MM.yyyy');

/// Overdue consignments table (`/consignments/overdue`, perm `consignment.read`).
class OverdueTable extends ConsumerWidget {
  const OverdueTable({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final overdue = ref.watch(dashOverdueProvider);

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(context.t('dashboard.overdueConsignmentsTitle'),
              style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 12),
          overdue.when(
            loading: () => const Loading(),
            error: (e, _) => ErrorView(message: '$e'),
            data: (rows) => rows.isEmpty
                ? EmptyView(
                    message: context.t('dashboard.overdueConsignmentsTitle'))
                : AppDataTable<OverdueConsignment>(
                    columns: [
                      context.t('consignments.partner'),
                      context.t('consignments.device'),
                      context.t('consignments.agreedPrice'),
                      context.t('consignments.dueDate'),
                    ],
                    rows: rows,
                    cells: (r) => [
                      Text(r.partnerShopName),
                      Text(r.imei),
                      Text(formatMoney(r.agreedPrice)),
                      StatusChip(_dateFmt.format(r.dueDate),
                          color: AppColors.danger),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
