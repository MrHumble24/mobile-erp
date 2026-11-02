import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../shared/ui/ui.dart';
import '../../../theme/tokens.dart';
import '../application/warranty_controller.dart';
import '../data/sales_views.dart';
import 'return_dialog.dart';

/// Scan an IMEI → warranty status + a return action. Lives beside the sales
/// list (side panel on wide, bottom sheet on narrow).
class WarrantyPanel extends ConsumerWidget {
  const WarrantyPanel({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(warrantyControllerProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(context.t('sales.warrantyLookup'),
            style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        ScannerField(
          hintText: context.t('pos.scanPrompt'),
          onScan: (imei) =>
              ref.read(warrantyControllerProvider.notifier).lookup(imei),
        ),
        const SizedBox(height: 16),
        Expanded(
          child: async.when(
            loading: () => const Loading(),
            error: (e, _) => EmptyView(
              icon: Icons.search_off,
              message: context.t('common.notFound'),
            ),
            data: (lookup) => lookup == null
                ? EmptyView(
                    icon: Icons.verified_user_outlined,
                    message: context.t('sales.warrantyLookup'),
                  )
                : _Result(lookup: lookup),
          ),
        ),
      ],
    );
  }
}

class _Result extends StatelessWidget {
  const _Result({required this.lookup});
  final WarrantyLookup lookup;

  @override
  Widget build(BuildContext context) {
    final active = lookup.active;
    return SingleChildScrollView(
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(lookup.imei,
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            StatusChip(
              active
                  ? context.t('sales.warrantyValid')
                  : context.t('sales.warrantyExpired'),
              color: active ? AppColors.success : AppColors.danger,
            ),
            const SizedBox(height: 12),
            _kv(context, context.t('sales.salePrice'), formatMoney(lookup.salePrice)),
            _kv(context, context.t('sales.remainingDays'), '${lookup.remainingDays}'),
            if (lookup.inspectionGrade != null)
              _kv(context, 'QC', lookup.inspectionGrade!),
            const SizedBox(height: 16),
            if (lookup.alreadyReturned)
              Text(context.t('sales.alreadyReturned'),
                  style: TextStyle(color: Theme.of(context).colorScheme.error))
            else
              FilledButton.icon(
                icon: const Icon(Icons.assignment_return),
                label: Text(context.t('sales.returnDevice')),
                onPressed: () => showReturnDialog(context, lookup.saleId),
              ),
          ],
        ),
      ),
    );
  }

  Widget _kv(BuildContext context, String k, String v) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [Text(k), Text(v)],
        ),
      );
}
