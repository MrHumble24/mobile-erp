import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/device.dart';
import '../data/device_repository.dart';

/// Reactive offline device list straight from the Drift cache.
final devicesStreamProvider = StreamProvider<List<DeviceListItem>>(
  (ref) => ref.watch(deviceRepositoryProvider).watchDevices(),
);

/// Inventory list filters (client-side over the cached list).
class DeviceFilter {
  const DeviceFilter({this.search = '', this.modelId, this.storage, this.statusCode});

  final String search;
  final String? modelId;
  final String? storage;
  final String? statusCode;

  DeviceFilter copyWith({
    String? search,
    Object? modelId = _keep,
    Object? storage = _keep,
    Object? statusCode = _keep,
  }) =>
      DeviceFilter(
        search: search ?? this.search,
        modelId: modelId == _keep ? this.modelId : modelId as String?,
        storage: storage == _keep ? this.storage : storage as String?,
        statusCode: statusCode == _keep ? this.statusCode : statusCode as String?,
      );

  bool get isEmpty =>
      search.isEmpty && modelId == null && storage == null && statusCode == null;

  int get activeCount => [
        if (modelId != null) 1,
        if (storage != null) 1,
        if (statusCode != null) 1,
      ].length;

  static const _keep = Object();
}

class DeviceFilterController extends Notifier<DeviceFilter> {
  @override
  DeviceFilter build() => const DeviceFilter();

  void setSearch(String v) => state = state.copyWith(search: v);
  void setModel(String? v) => state = state.copyWith(modelId: v);
  void setStorage(String? v) => state = state.copyWith(storage: v);
  void setStatus(String? v) => state = state.copyWith(statusCode: v);
  void toggleStatus(String code) =>
      state = state.copyWith(statusCode: state.statusCode == code ? null : code);
  void clear() => state = const DeviceFilter();
}

final deviceFilterProvider =
    NotifierProvider<DeviceFilterController, DeviceFilter>(
  DeviceFilterController.new,
);

/// The cached list narrowed by the active filters.
final filteredDevicesProvider = Provider<AsyncValue<List<DeviceListItem>>>((ref) {
  final filter = ref.watch(deviceFilterProvider);
  return ref.watch(devicesStreamProvider).whenData(
        (list) => list.where((d) {
          if (!d.matches(filter.search)) return false;
          if (filter.modelId != null && d.modelId != filter.modelId) return false;
          if (filter.storage != null && d.storage != filter.storage) return false;
          if (filter.statusCode != null && d.statusCode != filter.statusCode) {
            return false;
          }
          return true;
        }).toList(),
      );
});

/// Counts over the full cached list, for the metrics bar.
class DeviceMetrics {
  const DeviceMetrics({
    required this.total,
    required this.inStock,
    required this.defective,
    required this.consigned,
  });

  final int total;
  final int inStock;
  final int defective;
  final int consigned;
}

final deviceMetricsProvider = Provider<DeviceMetrics>((ref) {
  final list = ref.watch(devicesStreamProvider).valueOrNull ?? const [];
  var inStock = 0, defective = 0, consigned = 0;
  for (final d in list) {
    switch (d.statusCode) {
      case 'IN_STOCK':
        inStock++;
      case 'DEFECTIVE':
        defective++;
      case 'CONSIGNED':
        consigned++;
    }
  }
  return DeviceMetrics(
    total: list.length,
    inStock: inStock,
    defective: defective,
    consigned: consigned,
  );
});

/// Full device detail by IMEI (online; fetched when the sheet opens).
final deviceDetailProvider =
    FutureProvider.family<DeviceDetail, String>((ref, imei) {
  return ref.watch(deviceRepositoryProvider).detailByImei(imei);
});

/// Device status history by device id (online).
final deviceHistoryProvider =
    FutureProvider.family<List<DeviceHistoryEntry>, String>((ref, id) {
  return ref.watch(deviceRepositoryProvider).history(id);
});
