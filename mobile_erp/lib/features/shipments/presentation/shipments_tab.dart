import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../../../theme/tokens.dart';
import '../../auth/application/permissions.dart';
import '../../suppliers/suppliers_module.dart';
import '../data/shipment.dart';
import '../data/shipments_repository.dart';
import 'shipment_detail_sheet.dart';
import 'shipment_form_sheet.dart';
import 'intake_sheet.dart';

/// Shipments list tab. Lists batches newest-first; "New shipment" chains into
/// device intake once the batch is created.
class ShipmentsTab extends ConsumerWidget {
  const ShipmentsTab({super.key});

  Future<void> _newShipment(BuildContext context) async {
    final created = await showShipmentFormSheet(context);
    if (created != null && context.mounted) {
      await showIntakeSheet(context, created);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(shipmentsProvider);
    final names = {
      for (final s in ref.watch(suppliersProvider).valueOrNull ?? const [])
        s.id: s.name,
    };
    final canManage = ref.watch(canProvider)('shipment.manage');

    return Column(
      children: [
        if (canManage)
          Padding(
            padding: const EdgeInsets.all(16),
            child: Align(
              alignment: Alignment.centerRight,
              child: FilledButton.icon(
                onPressed: () => _newShipment(context),
                icon: const Icon(Icons.add),
                label: Text(context.t('shipments.newShipment')),
              ),
            ),
          ),
        Expanded(
          child: async.when(
            loading: () => const Loading(),
            error: (e, _) => ErrorView(
              message: '$e',
              onRetry: () => ref.invalidate(shipmentsProvider),
              retryLabel: context.t('common.retry'),
            ),
            data: (shipments) => shipments.isEmpty
                ? EmptyView(message: context.t('shipments.emptyHint'))
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    itemCount: shipments.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _ShipmentCard(
                      shipment: shipments[i],
                      supplierName: names[shipments[i].supplierId] ??
                          shipments[i].supplierId,
                    ),
                  ),
          ),
        ),
      ],
    );
  }
}

class _ShipmentCard extends StatelessWidget {
  const _ShipmentCard({required this.shipment, required this.supplierName});
  final Shipment shipment;
  final String supplierName;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final complete = shipment.isComplete;
    return AppCard(
      onTap: () => showShipmentDetailSheet(context, shipment),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(supplierName, style: text.titleMedium),
                const SizedBox(height: 4),
                Text(
                  '${shipment.shipmentDate.toIso8601String().split('T').first}'
                  ' · ${context.t('shipments.registeredProgress', {
                        'registered': shipment.deviceCount,
                        'expected': shipment.expectedCount,
                      })}',
                  style: text.bodySmall,
                ),
              ],
            ),
          ),
          StatusChip(
            context.t(complete ? 'shipments.statusComplete' : 'shipments.statusOpen'),
            color: complete ? AppColors.success : AppColors.warning,
          ),
          const Icon(Icons.chevron_right),
        ],
      ),
    );
  }
}
