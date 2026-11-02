import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../../shipments/shipments_module.dart'
    show ShipmentDevice, deviceModelNamesProvider, deviceQueryProvider;
import 'grade_device_sheet.dart';

/// Devices awaiting inspection (`GET /devices?inspected=false`). Tap a row to
/// open the grade sheet for that unit.
class QcQueueTab extends ConsumerWidget {
  const QcQueueTab({super.key});

  static const _arg = (
    shipmentId: null,
    inspected: 'false',
    page: 1,
    pageSize: 50,
  );

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final queue = ref.watch(deviceQueryProvider(_arg));
    final names = ref.watch(deviceModelNamesProvider);

    return queue.when(
      loading: () => const Loading(),
      error: (e, _) => ErrorView(
        message: '$e',
        onRetry: () => ref.invalidate(deviceQueryProvider(_arg)),
        retryLabel: context.t('common.retry'),
      ),
      data: (page) => page.items.isEmpty
          ? EmptyView(message: context.t('qc.queueEmpty'))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: page.items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (_, i) => _QueueRow(
                device: page.items[i],
                modelName: names[page.items[i].modelId] ??
                    page.items[i].modelId,
              ),
            ),
    );
  }
}

class _QueueRow extends StatelessWidget {
  const _QueueRow({required this.device, required this.modelName});
  final ShipmentDevice device;
  final String modelName;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return AppCard(
      onTap: () => showGradeDeviceSheet(context, device.imei),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(device.imei,
                    style: const TextStyle(fontFamily: 'monospace', fontSize: 13)),
                const SizedBox(height: 4),
                Text('$modelName · ${device.statusCode}', style: text.bodySmall),
              ],
            ),
          ),
          const Icon(Icons.chevron_right),
        ],
      ),
    );
  }
}
