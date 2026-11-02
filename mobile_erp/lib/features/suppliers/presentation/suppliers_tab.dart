import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../../../theme/tokens.dart';
import '../../auth/application/permissions.dart';
import '../data/supplier.dart';
import '../data/suppliers_repository.dart';
import 'supplier_form_sheet.dart';

/// Suppliers CRUD tab, embedded in the Shipments page. Lists suppliers and,
/// for `shipment.manage` users, opens the create/edit sheet.
class SuppliersTab extends ConsumerWidget {
  const SuppliersTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(suppliersProvider);
    final canManage = ref.watch(canProvider)('shipment.manage');

    return Column(
      children: [
        if (canManage)
          Padding(
            padding: const EdgeInsets.all(16),
            child: Align(
              alignment: Alignment.centerRight,
              child: FilledButton.icon(
                onPressed: () => showSupplierFormSheet(context),
                icon: const Icon(Icons.add),
                label: Text(context.t('shipments.newSupplier')),
              ),
            ),
          ),
        Expanded(
          child: async.when(
            loading: () => const Loading(),
            error: (e, _) => ErrorView(
              message: '$e',
              onRetry: () => ref.invalidate(suppliersProvider),
              retryLabel: context.t('common.retry'),
            ),
            data: (suppliers) => suppliers.isEmpty
                ? EmptyView(message: context.t('shipments.empty'))
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    itemCount: suppliers.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _SupplierCard(
                      supplier: suppliers[i],
                      canManage: canManage,
                    ),
                  ),
          ),
        ),
      ],
    );
  }
}

class _SupplierCard extends StatelessWidget {
  const _SupplierCard({required this.supplier, required this.canManage});
  final Supplier supplier;
  final bool canManage;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final subtitle = [supplier.country, supplier.contact]
        .where((e) => e != null && e.isNotEmpty)
        .join(' · ');
    return AppCard(
      onTap: canManage
          ? () => showSupplierFormSheet(context, existing: supplier)
          : null,
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(supplier.name, style: text.titleMedium),
                if (subtitle.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(subtitle, style: text.bodySmall),
                ],
              ],
            ),
          ),
          StatusChip(
            context.t(supplier.isActive ? 'shipments.supplierActive' : 'common.no'),
            color: supplier.isActive ? AppColors.success : AppColors.ash,
          ),
          if (canManage) const Icon(Icons.chevron_right),
        ],
      ),
    );
  }
}
