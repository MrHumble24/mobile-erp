import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import 'shipment_device.dart';

/// Read access to `GET /devices` (perm `device.read`). Shared by the shipment
/// detail devices table (`shipmentId`) and the QC queue (`inspected=false`).
class DevicesRepository {
  DevicesRepository(this._dio);
  final Dio _dio;

  Future<PaginatedDevices> query({
    String? shipmentId,
    String? inspected,
    int page = 1,
    int pageSize = 50,
  }) =>
      runApi(() async {
        final res = await _dio.get<Map<String, dynamic>>(
          '/devices',
          queryParameters: {
            'shipmentId': ?shipmentId,
            'inspected': ?inspected,
            'page': page,
            'pageSize': pageSize,
          },
        );
        return PaginatedDevices.fromJson(res.data!);
      });
}

final devicesRepositoryProvider = Provider<DevicesRepository>(
  (ref) => DevicesRepository(ref.watch(dioProvider)),
);

/// Family key for a device page query. Records give value equality for free.
typedef DeviceQueryArg = ({
  String? shipmentId,
  String? inspected,
  int page,
  int pageSize,
});

/// One page of devices for the given filter. The shipment detail and the QC
/// queue both watch this with different args.
final deviceQueryProvider =
    FutureProvider.family<PaginatedDevices, DeviceQueryArg>(
  (ref, arg) => ref.watch(devicesRepositoryProvider).query(
        shipmentId: arg.shipmentId,
        inspected: arg.inspected,
        page: arg.page,
        pageSize: arg.pageSize,
      ),
);
