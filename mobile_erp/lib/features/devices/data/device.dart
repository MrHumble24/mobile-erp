import 'dart:convert';

import '../../../data/local/database.dart';

/// A device as shown in the offline list. Built from the Drift [Device] row
/// hydrated by `/sync/changes`; cost fields are never in the cache. `specs` is
/// decoded from the stored JSON blob.
class DeviceListItem {
  const DeviceListItem({
    required this.id,
    required this.imei,
    required this.statusCode,
    required this.modelLabel,
    required this.modelId,
    required this.specs,
    required this.targetPrice,
  });

  final String id;
  final String imei;
  final String statusCode;
  final String modelLabel;
  final String modelId;
  final Map<String, dynamic> specs;
  final String? targetPrice;

  String? get storage => specs['storage']?.toString();

  factory DeviceListItem.fromRow(Device row) {
    Map<String, dynamic> specs;
    try {
      specs = (jsonDecode(row.specs) as Map).cast<String, dynamic>();
    } catch (_) {
      specs = const {};
    }
    return DeviceListItem(
      id: row.id,
      imei: row.imei,
      statusCode: row.statusCode,
      modelLabel: '${row.modelBrand} ${row.modelName}'.trim(),
      modelId: row.modelId,
      specs: specs,
      targetPrice: row.targetPrice,
    );
  }

  bool matches(String query) {
    if (query.isEmpty) return true;
    final q = query.toLowerCase();
    return imei.toLowerCase().contains(q) ||
        modelLabel.toLowerCase().contains(q);
  }
}

/// Latest QC inspection summary attached to a device detail.
class QcSummary {
  const QcSummary({
    required this.passed,
    required this.gradeCode,
    required this.batteryHealth,
  });

  final bool passed;
  final String? gradeCode;
  final int? batteryHealth;

  factory QcSummary.fromJson(Map<String, dynamic> json) => QcSummary(
        passed: json['passed'] as bool? ?? false,
        gradeCode: json['gradeCode'] as String?,
        batteryHealth: (json['batteryHealth'] as num?)?.toInt(),
      );
}

/// Full device detail from `/devices/by-imei/:imei`. `landedCost` is present
/// only for users with `device.cost.view` (redacted otherwise → null).
class DeviceDetail {
  const DeviceDetail({
    required this.id,
    required this.imei,
    required this.modelId,
    required this.modelLabel,
    required this.statusCode,
    required this.specs,
    required this.targetPrice,
    required this.landedCost,
    required this.intakeDate,
    required this.version,
    required this.latestInspection,
  });

  final String id;
  final String imei;
  final String modelId;
  final String modelLabel;
  final String statusCode;
  final Map<String, dynamic> specs;
  final String? targetPrice;
  final String? landedCost;
  final String intakeDate;
  final int version;
  final QcSummary? latestInspection;

  factory DeviceDetail.fromJson(Map<String, dynamic> json) {
    final model = (json['model'] as Map?)?.cast<String, dynamic>() ?? const {};
    final qc = json['latestInspection'];
    return DeviceDetail(
      id: json['id'] as String,
      imei: json['imei'] as String,
      modelId: json['modelId'] as String,
      modelLabel: '${model['brand'] ?? ''} ${model['name'] ?? ''}'.trim(),
      statusCode: json['statusCode'] as String,
      specs: (json['specs'] as Map?)?.cast<String, dynamic>() ?? const {},
      targetPrice: json['targetPrice']?.toString(),
      landedCost: json['landedCost']?.toString(),
      intakeDate: json['intakeDate']?.toString() ?? '',
      version: (json['version'] as num).toInt(),
      latestInspection:
          qc == null ? null : QcSummary.fromJson((qc as Map).cast()),
    );
  }
}

/// One status-history row from `/devices/:id/history`.
class DeviceHistoryEntry {
  const DeviceHistoryEntry({
    required this.id,
    required this.fromStatusCode,
    required this.toStatusCode,
    required this.reason,
    required this.changedAt,
  });

  final String id;
  final String? fromStatusCode;
  final String toStatusCode;
  final String? reason;
  final String changedAt;

  factory DeviceHistoryEntry.fromJson(Map<String, dynamic> json) =>
      DeviceHistoryEntry(
        id: json['id'] as String,
        fromStatusCode: json['fromStatusCode'] as String?,
        toStatusCode: json['toStatusCode'] as String,
        reason: json['reason'] as String?,
        changedAt: json['changedAt']?.toString() ?? '',
      );
}
