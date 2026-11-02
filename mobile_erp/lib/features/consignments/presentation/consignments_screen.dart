import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../shared/ui/ui.dart';
import '../../../theme/tokens.dart';
import '../../auth/application/permissions.dart';
import '../application/consignment_providers.dart';
import '../data/consignment_models.dart';
import 'consign_device_dialog.dart';
import 'return_consignment_dialog.dart';
import 'settle_consignment_dialog.dart';

/// Consignments with Out / Overdue / All tabs. Each OUT row offers settle and
/// return actions; `consignment.create` holders can consign a device.
class ConsignmentsScreen extends ConsumerWidget {
  const ConsignmentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final can = ref.watch(canProvider);
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: TabBar(
          tabs: [
            Tab(text: context.t('consignments.tabOut')),
            Tab(text: context.t('consignments.tabOverdue')),
            Tab(text: context.t('common.all')),
          ],
        ),
        floatingActionButton: can('consignment.create')
            ? FloatingActionButton.extended(
                onPressed: () => showConsignDeviceDialog(context),
                icon: const Icon(Icons.add),
                label: Text(context.t('consignments.newConsignment')),
              )
            : null,
        body: TabBarView(
          children: [
            _ConsignmentList(provider: consignmentsProvider('OUT')),
            _ConsignmentList(provider: overdueConsignmentsProvider),
            _ConsignmentList(provider: consignmentsProvider(null)),
          ],
        ),
      ),
    );
  }
}

class _ConsignmentList extends ConsumerWidget {
  const _ConsignmentList({required this.provider});

  final ProviderListenable<AsyncValue<List<ConsignmentView>>> provider;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(provider);
    return items.when(
      loading: () => const Loading(),
      error: (e, _) => ErrorView(
        message: context.t('common.error'),
        onRetry: () => refreshConsignments(ref),
        retryLabel: context.t('common.retry'),
      ),
      data: (rows) => rows.isEmpty
          ? EmptyView(message: context.t('consignments.noConsignmentsFound'))
          : _ConsignmentTable(rows: rows),
    );
  }
}

class _ConsignmentTable extends StatelessWidget {
  const _ConsignmentTable({required this.rows});

  final List<ConsignmentView> rows;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: AppDataTable<ConsignmentView>(
        columns: [
          context.t('consignments.device'),
          context.t('consignments.agreedPrice'),
          context.t('consignments.dueDate'),
          context.t('common.status'),
          context.t('common.actions'),
        ],
        rows: rows,
        cells: (c) => [
          Text(c.imei),
          Text(formatMoney(c.agreedPrice)),
          Text(_date(c.dueDate)),
          _StatusChip(statusCode: c.statusCode),
          c.isOut ? _RowActions(item: c) : const Text('—'),
        ],
      ),
    );
  }

  String _date(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}

class _RowActions extends StatelessWidget {
  const _RowActions({required this.item});
  final ConsignmentView item;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        TextButton(
          onPressed: () => showSettleDialog(context, item),
          child: Text(context.t('consignments.settle')),
        ),
        TextButton(
          onPressed: () => showReturnDialog(context, item),
          child: Text(context.t('consignments.return')),
        ),
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.statusCode});
  final String statusCode;

  @override
  Widget build(BuildContext context) {
    final color = switch (statusCode) {
      'OUT' => AppColors.signalBlue,
      'SETTLED' => AppColors.success,
      'RETURNED' => AppColors.ash,
      _ => AppColors.ash,
    };
    return StatusChip(statusCode, color: color);
  }
}
