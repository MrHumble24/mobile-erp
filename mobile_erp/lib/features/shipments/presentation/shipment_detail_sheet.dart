import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:mobile_erp/shared/lib/money.dart';

import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../../auth/application/permissions.dart';
import '../data/device_models_repository.dart';
import '../data/devices_repository.dart';
import '../data/shipment.dart';
import '../data/shipment_device.dart';
import 'intake_sheet.dart';
import 'shipment_form_sheet.dart';

/// Shipment summary + its registered devices. Hosts the edit and continue-
/// intake actions. Opened from the shipments list.
///
/// ponytail: shows the first page of devices (pageSize 50); batches rarely
/// exceed that. Add prev/next here if a store ever runs larger batches.
Future<void> showShipmentDetailSheet(BuildContext context, Shipment shipment) {
  return showAppBottomSheet<void>(
    context,
    builder: (_) => _ShipmentDetail(shipment: shipment),
  );
}

class _ShipmentDetail extends ConsumerWidget {
  const _ShipmentDetail({required this.shipment});
  final Shipment shipment;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final names = ref.watch(deviceModelNamesProvider);
    final devices = ref.watch(deviceQueryProvider((
      shipmentId: shipment.id,
      inspected: null,
      page: 1,
      pageSize: 50,
    )));
    final can = ref.watch(canProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(context.t('shipments.detailTitle'),
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(
            context.t('shipments.registeredProgress', {
              'registered': shipment.deviceCount,
              'expected': shipment.expectedCount,
            }),
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              if (can('shipment.manage'))
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () =>
                        showShipmentFormSheet(context, existing: shipment),
                    icon: const Icon(Icons.edit),
                    label: Text(context.t('shipments.editShipment')),
                  ),
                ),
              if (can('shipment.manage') && can('device.create'))
                const SizedBox(width: 12),
              if (can('device.create'))
                Expanded(
                  child: FilledButton.icon(
                    onPressed: () => showIntakeSheet(context, shipment),
                    icon: const Icon(Icons.add),
                    label: Text(context.t('shipments.continueIntake')),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          devices.when(
            loading: () => const Padding(
              padding: EdgeInsets.all(24),
              child: Loading(),
            ),
            error: (e, _) => ErrorView(message: '$e'),
            data: (page) => page.total == 0
                ? EmptyView(message: context.t('shipments.noDevices'))
                : _DevicesTable(page: page, names: names),
          ),
        ],
      ),
    );
  }
}

class _DevicesTable extends StatelessWidget {
  const _DevicesTable({required this.page, required this.names});
  final PaginatedDevices page;
  final Map<String, String> names;

  @override
  Widget build(BuildContext context) {
    final showCost = page.items.any((d) => d.landedCost != null);
    return AppDataTable<ShipmentDevice>(
      columns: [
        'IMEI',
        context.t('shipments.selectModel'),
        context.t('common.status'),
        if (showCost) context.t('shipments.avgLandedPerUnit'),
      ],
      rows: page.items,
      cells: (d) => [
        Text(d.imei,
            style: const TextStyle(fontFamily: 'monospace', fontSize: 12)),
        Text(names[d.modelId] ?? d.modelId),
        Text(d.statusCode),
        if (showCost) Text(formatMoney(d.landedCost)),
      ],
    );
  }
}
