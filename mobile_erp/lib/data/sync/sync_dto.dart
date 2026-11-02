import 'dart:convert';

import 'package:drift/drift.dart';

import '../local/database.dart';

/// Maps the `/sync/changes` JSON payload into Drift companions. Kept here so
/// the pull service stays about paging, not field plucking.
class ChangesPage {
  const ChangesPage({
    required this.nextSince,
    required this.devices,
    required this.partners,
  });

  /// Cursor for the next page, or null when fully drained.
  final String? nextSince;
  final List<DevicesCompanion> devices;
  final List<PartnersCompanion> partners;

  factory ChangesPage.fromJson(Map<String, dynamic> json) {
    final devices = (json['devices'] as List? ?? [])
        .map((e) => _device(e as Map<String, dynamic>))
        .toList();
    final partners = (json['partners'] as List? ?? [])
        .map((e) => _partner(e as Map<String, dynamic>))
        .toList();
    return ChangesPage(
      nextSince: json['nextSince'] as String?,
      devices: devices,
      partners: partners,
    );
  }

  static DevicesCompanion _device(Map<String, dynamic> d) {
    final model = (d['model'] as Map?)?.cast<String, dynamic>() ?? const {};
    final inspection =
        (d['latestInspection'] as Map?)?.cast<String, dynamic>();
    final sale = d['latestSale'];
    return DevicesCompanion.insert(
      id: d['id'] as String,
      imei: d['imei'] as String,
      statusCode: d['statusCode'] as String,
      version: (d['version'] as num).toInt(),
      targetPrice: Value(d['targetPrice']?.toString()),
      specs: Value(jsonEncode(d['specs'] ?? const {})),
      modelId: (model['id'] ?? '') as String,
      modelBrand: (model['brand'] ?? '') as String,
      modelName: (model['name'] ?? '') as String,
      latestSale: Value(sale == null ? null : jsonEncode(sale)),
      gradeCode: Value(inspection?['gradeCode'] as String?),
      inspectionNotes: Value(inspection?['notes'] as String?),
      updatedAt: d['updatedAt'] as String,
    );
  }

  static PartnersCompanion _partner(Map<String, dynamic> p) {
    return PartnersCompanion.insert(
      id: p['id'] as String,
      shopName: p['shopName'] as String,
      phone: Value(p['phone'] as String?),
      creditLimit: p['creditLimit'].toString(),
      outstanding: p['outstanding'].toString(),
    );
  }
}
