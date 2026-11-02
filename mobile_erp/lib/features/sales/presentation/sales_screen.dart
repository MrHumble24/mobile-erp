import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../shared/ui/ui.dart';
import '../application/sales_providers.dart';
import '../data/sale_models.dart';
import '../data/sales_repository.dart';
import 'sale_detail_sheet.dart';
import 'sales_filters_bar.dart';
import 'warranty_panel.dart';

/// Sales list with channel/date filters and a warranty-lookup panel. The panel
/// sits beside the list on wide layouts and opens as a sheet on narrow ones.
class SalesScreen extends ConsumerWidget {
  const SalesScreen({super.key});

  static const double _wide = 900;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wide = MediaQuery.sizeOf(context).width >= _wide;
    final list = _SalesList(
      header: const SalesFiltersBar(),
      onRefresh: () => ref.invalidate(salesListProvider),
    );

    if (wide) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(child: list),
          const VerticalDivider(width: 1),
          const SizedBox(
            width: 360,
            child: Padding(padding: EdgeInsets.all(16), child: WarrantyPanel()),
          ),
        ],
      );
    }

    return Scaffold(
      body: list,
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.verified_user_outlined),
        label: Text(context.t('sales.warrantyLookup')),
        onPressed: () => showAppBottomSheet<void>(
          context,
          builder: (_) => SizedBox(
            height: MediaQuery.sizeOf(context).height * 0.85,
            child: const Padding(padding: EdgeInsets.all(16), child: WarrantyPanel()),
          ),
        ),
      ),
    );
  }
}

class _SalesList extends ConsumerWidget {
  const _SalesList({required this.header, required this.onRefresh});
  final Widget header;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(salesListProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(padding: const EdgeInsets.all(16), child: header),
        Expanded(
          child: async.when(
            loading: () => const Loading(),
            error: (e, _) => ErrorView(
              message: '$e',
              onRetry: onRefresh,
              retryLabel: context.t('common.retry'),
            ),
            data: (page) => page.items.isEmpty
                ? EmptyView(message: context.t('sales.noSalesFound'))
                : _Table(page: page),
          ),
        ),
      ],
    );
  }
}

class _Table extends StatelessWidget {
  const _Table({required this.page});
  final SalesPage page;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: AppDataTable<SaleView>(
        columns: [
          context.t('pos.deviceCard'),
          context.t('sales.customer'),
          context.t('sales.salePrice'),
          context.t('sales.soldAt'),
        ],
        rows: page.items,
        onRowTap: (s) => showSaleDetailSheet(context, s),
        cells: (s) => [
          Text('${s.device.model.label}\n${s.device.imei}'),
          Text(s.customer?.name ?? '—'),
          Text(formatMoney(s.salePrice)),
          Text(s.soldAt == null
              ? '—'
              : '${s.soldAt!.year}-${s.soldAt!.month.toString().padLeft(2, '0')}-${s.soldAt!.day.toString().padLeft(2, '0')}'),
        ],
      ),
    );
  }
}
