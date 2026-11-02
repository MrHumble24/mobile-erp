import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../../device_models/device_models_module.dart';
import '../application/devices_providers.dart';
import '../data/device.dart';
import '../data/device_status.dart';
import 'device_sheet.dart';
import 'inventory_metrics_bar.dart';

const _storageOptions = ['64GB', '128GB', '256GB', '512GB', '1TB'];

/// Devices tab: offline-first list (Drift) with metrics, scan/search and
/// model/storage filters. Rows open the device detail sheet.
class DevicesTab extends ConsumerWidget {
  const DevicesTab({required this.onShowAlerts, super.key});

  final VoidCallback onShowAlerts;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final devices = ref.watch(filteredDevicesProvider);
    final filter = ref.watch(deviceFilterProvider);
    final controller = ref.read(deviceFilterProvider.notifier);
    final models = ref.watch(deviceModelsProvider).valueOrNull ?? const [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 12),
        InventoryMetricsBar(onShowAlerts: onShowAlerts),
        const SizedBox(height: 12),
        ScannerField(
          hintText: context.t('inventory.scanOrSearch'),
          autofocus: false,
          onScan: controller.setSearch,
        ),
        const SizedBox(height: 8),
        _FilterRow(
          filter: filter,
          models: models,
          onModel: controller.setModel,
          onStorage: controller.setStorage,
          onClear: controller.clear,
        ),
        const SizedBox(height: 8),
        Expanded(
          child: devices.when(
            loading: () => const Loading(),
            error: (e, _) => ErrorView(message: e.toString()),
            data: (list) => list.isEmpty
                ? EmptyView(message: context.t('inventory.empty'))
                : _DeviceList(devices: list),
          ),
        ),
      ],
    );
  }
}

class _FilterRow extends StatelessWidget {
  const _FilterRow({
    required this.filter,
    required this.models,
    required this.onModel,
    required this.onStorage,
    required this.onClear,
  });

  final DeviceFilter filter;
  final List<DeviceModelView> models;
  final ValueChanged<String?> onModel;
  final ValueChanged<String?> onStorage;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        SizedBox(
          width: 180,
          child: DropdownButtonFormField<String?>(
            initialValue: filter.modelId,
            isExpanded: true,
            decoration:
                InputDecoration(labelText: context.t('inventory.filterModel')),
            items: [
              DropdownMenuItem(
                  value: null, child: Text(context.t('inventory.allModels'))),
              for (final m in models)
                DropdownMenuItem(value: m.id, child: Text(m.label)),
            ],
            onChanged: onModel,
          ),
        ),
        SizedBox(
          width: 140,
          child: DropdownButtonFormField<String?>(
            initialValue:
                _storageOptions.contains(filter.storage) ? filter.storage : null,
            isExpanded: true,
            decoration:
                InputDecoration(labelText: context.t('inventory.filterStorage')),
            items: [
              DropdownMenuItem(
                  value: null, child: Text(context.t('inventory.allStorages'))),
              for (final s in _storageOptions)
                DropdownMenuItem(value: s, child: Text(s)),
            ],
            onChanged: onStorage,
          ),
        ),
        if (!filter.isEmpty)
          TextButton.icon(
            onPressed: onClear,
            icon: const Icon(Icons.clear, size: 16),
            label: Text(context.t('inventory.clearFilters')),
          ),
      ],
    );
  }
}

class _DeviceList extends StatelessWidget {
  const _DeviceList({required this.devices});

  final List<DeviceListItem> devices;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      itemCount: devices.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final d = devices[i];
        return AppCard(
          onTap: () => showDeviceSheet(context, d.imei),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(d.modelLabel,
                        style: Theme.of(context).textTheme.titleMedium),
                    Text(
                      '${d.imei}${d.storage != null ? ' · ${d.storage}' : ''}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              StatusChip(
                context.t(DeviceStatusMeta.labelKey(d.statusCode)),
                color: DeviceStatusMeta.color(d.statusCode),
              ),
            ],
          ),
        );
      },
    );
  }
}
