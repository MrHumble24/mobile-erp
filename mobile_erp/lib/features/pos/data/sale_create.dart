import 'dart:convert';

import 'package:drift/drift.dart';

import '../../../data/local/database.dart';

/// Pure builders for a `sale.create` mutation. Kept free of Flutter/HTTP so the
/// same payload is used online (POST body) and offline (outbox payload), and so
/// the offline-enqueue shape is unit-testable.

/// The `CreateSaleDto` body. Omits every absent optional (server runs
/// `forbidNonWhitelisted`, so no stray keys). A new inline customer and an
/// existing [customerId] are mutually exclusive.
Map<String, dynamic> buildSalePayload({
  required String imei,
  required double salePrice,
  required String clientMutationId,
  required int expectedVersion,
  String? customerId,
  String? customerName,
  String? customerPhone,
  int? warrantyDays,
  String? notes,
}) {
  return {
    'imei': imei,
    'salePrice': salePrice,
    'clientMutationId': clientMutationId,
    'expectedVersion': expectedVersion,
    if (customerId != null && customerId.isNotEmpty)
      'customerId': customerId
    else if (customerName != null && customerName.trim().isNotEmpty)
      'customer': {
        'name': customerName.trim(),
        if (customerPhone != null && customerPhone.trim().isNotEmpty)
          'phone': customerPhone.trim(),
      },
    'warrantyDays': ?warrantyDays,
    if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
  };
}

/// The outbox row for an offline sale. `id` = `clientMutationId` (the push
/// mutation id the server dedups on); `baseVersion` = the device version at
/// scan time, per FOUNDATION §offline.
OutboxCompanion buildSaleOutboxEntry({
  required String clientMutationId,
  required Map<String, dynamic> payload,
  required int baseVersion,
  DateTime? occurredAt,
}) {
  return OutboxCompanion.insert(
    id: clientMutationId,
    type: 'sale.create',
    payload: jsonEncode(payload),
    occurredAt: (occurredAt ?? DateTime.now()).toIso8601String(),
    baseVersion: Value(baseVersion),
  );
}
