import '../../../data/local/database.dart';

/// A device resolved for checkout — from the offline Drift cache or the remote
/// by-imei lookup, normalized to the fields POS needs.
class ScannedDevice {
  const ScannedDevice({
    required this.id,
    required this.imei,
    required this.version,
    required this.statusCode,
    required this.modelLabel,
    this.targetPrice,
  });

  final String id;
  final String imei;
  final int version;
  final String statusCode;
  final String modelLabel;
  final String? targetPrice;

  bool get inStock => statusCode == 'IN_STOCK';

  /// From the cached Drift [Device] row (offline path).
  factory ScannedDevice.fromCache(Device d) => ScannedDevice(
        id: d.id,
        imei: d.imei,
        version: d.version,
        statusCode: d.statusCode,
        modelLabel: '${d.modelBrand} ${d.modelName}'.trim(),
        targetPrice: d.targetPrice,
      );

  /// From the `/devices/by-imei/:imei` detail view (online path).
  factory ScannedDevice.fromJson(Map<String, dynamic> j) {
    final model = (j['model'] as Map?)?.cast<String, dynamic>() ?? const {};
    return ScannedDevice(
      id: '${j['id']}',
      imei: '${j['imei'] ?? ''}',
      version: (j['version'] as num?)?.toInt() ?? 0,
      statusCode: '${j['statusCode'] ?? ''}',
      modelLabel: '${model['brand'] ?? ''} ${model['name'] ?? ''}'.trim(),
      targetPrice: j['targetPrice']?.toString(),
    );
  }
}

/// The result of a checkout, used to render the receipt modal. Built from local
/// data so it works identically online and offline (there is no server
/// response to wait for when queued).
class CompletedSale {
  const CompletedSale({
    required this.receiptId,
    required this.imei,
    required this.modelLabel,
    required this.salePrice,
    required this.soldAt,
    required this.cashier,
    required this.warrantyDays,
    required this.pending,
    this.customerName,
    this.warrantyEndsAt,
  });

  final String receiptId;
  final String imei;
  final String modelLabel;
  final String salePrice;
  final DateTime soldAt;
  final String cashier;
  final int warrantyDays;

  /// True when queued offline (awaiting `/sync/push`); shown as "pending sync".
  final bool pending;
  final String? customerName;
  final DateTime? warrantyEndsAt;
}
