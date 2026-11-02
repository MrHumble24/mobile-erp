/// A received batch of devices from a supplier. Mirrors `ShipmentView`.
/// `overheadCost` is cost-redacted → absent (null) for under-privileged users.
class Shipment {
  const Shipment({
    required this.id,
    required this.supplierId,
    required this.shipmentDate,
    required this.expectedCount,
    required this.deviceCount,
    this.overheadCost,
    this.notes,
  });

  final String id;
  final String supplierId;
  final DateTime shipmentDate;
  final int expectedCount;
  final int deviceCount;
  final String? overheadCost;
  final String? notes;

  bool get isComplete => deviceCount >= expectedCount;

  factory Shipment.fromJson(Map<String, dynamic> json) => Shipment(
        id: json['id'] as String,
        supplierId: json['supplierId'] as String,
        shipmentDate: DateTime.parse(json['shipmentDate'] as String),
        expectedCount: (json['expectedCount'] as num).toInt(),
        deviceCount: (json['deviceCount'] as num?)?.toInt() ?? 0,
        overheadCost: json['overheadCost']?.toString(),
        notes: json['notes'] as String?,
      );
}

/// Confirmation of one unit registered during intake, with its allocated
/// landed cost. Cost fields are redaction-nullable.
class RegisteredDevice {
  const RegisteredDevice({
    required this.id,
    required this.imei,
    required this.modelId,
    required this.statusCode,
    this.acquisitionCost,
    this.landedCost,
    this.targetPrice,
  });

  final String id;
  final String imei;
  final String modelId;
  final String statusCode;
  final String? acquisitionCost;
  final String? landedCost;
  final String? targetPrice;

  factory RegisteredDevice.fromJson(Map<String, dynamic> json) =>
      RegisteredDevice(
        id: json['id'] as String,
        imei: json['imei'] as String,
        modelId: json['modelId'] as String,
        statusCode: json['statusCode'] as String,
        acquisitionCost: json['acquisitionCost']?.toString(),
        landedCost: json['landedCost']?.toString(),
        targetPrice: json['targetPrice']?.toString(),
      );
}
