/// A device row as returned by `GET /devices` (the paginated `DeviceListView`).
/// Used by the shipment detail devices table and the QC queue. Cost fields are
/// redaction-nullable; `latestInspection` is null when never inspected.
class ShipmentDevice {
  const ShipmentDevice({
    required this.id,
    required this.imei,
    required this.modelId,
    required this.statusCode,
    required this.specs,
    this.acquisitionCost,
    this.landedCost,
    this.targetPrice,
    this.latestInspection,
  });

  final String id;
  final String imei;
  final String modelId;
  final String statusCode;
  final Map<String, dynamic> specs;
  final String? acquisitionCost;
  final String? landedCost;
  final String? targetPrice;
  final DeviceInspectionSummary? latestInspection;

  String? spec(String key) => specs[key]?.toString();

  factory ShipmentDevice.fromJson(Map<String, dynamic> json) => ShipmentDevice(
        id: json['id'] as String,
        imei: json['imei'] as String,
        modelId: json['modelId'] as String,
        statusCode: json['statusCode'] as String,
        specs: (json['specs'] as Map?)?.cast<String, dynamic>() ?? const {},
        acquisitionCost: json['acquisitionCost']?.toString(),
        landedCost: json['landedCost']?.toString(),
        targetPrice: json['targetPrice']?.toString(),
        latestInspection: json['latestInspection'] == null
            ? null
            : DeviceInspectionSummary.fromJson(
                (json['latestInspection'] as Map).cast()),
      );
}

/// Minimal QC summary attached to a device row.
class DeviceInspectionSummary {
  const DeviceInspectionSummary({required this.passed, this.gradeCode});

  final bool passed;
  final String? gradeCode;

  factory DeviceInspectionSummary.fromJson(Map<String, dynamic> json) =>
      DeviceInspectionSummary(
        passed: (json['passed'] as bool?) ?? false,
        gradeCode: json['gradeCode'] as String?,
      );
}

/// One page of a device query.
class PaginatedDevices {
  const PaginatedDevices({
    required this.items,
    required this.total,
    required this.page,
    required this.pageSize,
  });

  final List<ShipmentDevice> items;
  final int total;
  final int page;
  final int pageSize;

  factory PaginatedDevices.fromJson(Map<String, dynamic> json) =>
      PaginatedDevices(
        items: (json['items'] as List? ?? const [])
            .map((e) => ShipmentDevice.fromJson((e as Map).cast()))
            .toList(),
        total: (json['total'] as num?)?.toInt() ?? 0,
        page: (json['page'] as num?)?.toInt() ?? 1,
        pageSize: (json['pageSize'] as num?)?.toInt() ?? 50,
      );
}
