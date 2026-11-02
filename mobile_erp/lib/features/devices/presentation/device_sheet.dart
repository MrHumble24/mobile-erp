import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../../auth/application/permissions.dart';
import '../application/devices_providers.dart';
import '../data/device.dart';
import 'device_sheet_sections.dart';
import 'edit_device_dialog.dart';
import 'status_change_form.dart';

/// Opens the device detail sheet for [imei]. Resolves the full device online
/// (the offline list only caches a subset), then shows specs, QC, history and
/// the status-change form.
Future<void> showDeviceSheet(BuildContext context, String imei) {
  return showAppBottomSheet<void>(
    context,
    builder: (_) => _DeviceSheet(imei: imei),
  );
}

class _DeviceSheet extends ConsumerWidget {
  const _DeviceSheet({required this.imei});

  final String imei;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(deviceDetailProvider(imei));
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.85,
      child: detail.when(
        loading: () => const Loading(),
        error: (_, _) => _NotFound(),
        data: (device) => _DeviceSheetBody(device: device),
      ),
    );
  }
}

class _NotFound extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return EmptyView(
      icon: Icons.phonelink_erase_outlined,
      message: context.t('inventory.imeiNotFound'),
    );
  }
}

class _DeviceSheetBody extends ConsumerWidget {
  const _DeviceSheetBody({required this.device});

  final DeviceDetail device;

  Future<void> _edit(BuildContext context) async {
    final saved = await showAppBottomSheet<bool>(
      context,
      builder: (_) => EditDeviceSheet(device: device),
    );
    if (saved == true && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.t('common.success'))),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final can = ref.watch(canProvider);
    final history = ref.watch(deviceHistoryProvider(device.id));
    final text = Theme.of(context).textTheme;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      children: [
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    device.modelLabel.isEmpty
                        ? context.t('inventory.imeiDetails')
                        : device.modelLabel,
                    style: text.titleLarge,
                  ),
                  Row(
                    children: [
                      Flexible(
                        child: Text('IMEI: ${device.imei}',
                            style: text.bodySmall),
                      ),
                      IconButton(
                        tooltip: context.t('inventory.copyImei'),
                        icon: const Icon(Icons.copy, size: 16),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: device.imei));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                                content: Text(context.t('inventory.imeiCopied'))),
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (can('device.update'))
              OutlinedButton.icon(
                onPressed: () => _edit(context),
                icon: const Icon(Icons.edit, size: 16),
                label: Text(context.t('inventory.editDevice')),
              ),
          ],
        ),
        const SizedBox(height: 16),
        DeviceBarcode(imei: device.imei),
        const SizedBox(height: 16),
        DeviceSpecsGrid(device: device, canViewCost: can('device.cost.view')),
        const SizedBox(height: 16),
        Text(context.t('inventory.qcInspection'), style: text.titleSmall),
        const SizedBox(height: 8),
        QcSummarySection(qc: device.latestInspection),
        const SizedBox(height: 16),
        Text(context.t('inventory.history'), style: text.titleSmall),
        const SizedBox(height: 8),
        history.when(
          loading: () => const Loading(),
          error: (_, _) => const Text('—'),
          data: (rows) => DeviceHistoryList(history: rows),
        ),
        if (can('device.status.change')) StatusChangeForm(device: device),
      ],
    );
  }
}
