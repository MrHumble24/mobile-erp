import 'dart:convert';

import 'package:drift/drift.dart' show Value;
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/ids.dart';
import '../../../data/local/database.dart';
import '../../../data/local/database_provider.dart';
import '../../../data/sync/connectivity.dart';
import '../../../data/sync/sync_controller.dart';
import '../data/consignment_repository.dart';

/// The offline-capable consignment lifecycle. The three server-registered
/// mutation types (`consignment.create|settle|return`) go straight to REST when
/// online, else to the outbox for the push drain. A network failure mid-call
/// also falls back to the outbox so a money-path write is never lost.
///
/// `expectedVersion`/`baseVersion` is the consigned device's cached version
/// (optimistic concurrency); settle/return payloads carry `consignmentId` since
/// the queue has no path param. Create reuses one UUID as both the outbox id and
/// `clientMutationId`, so a retry is idempotent on the server.
class ConsignmentWriter {
  ConsignmentWriter(this._ref);
  final Ref _ref;

  ConsignmentRepository get _repo => _ref.read(consignmentRepositoryProvider);
  AppDatabase get _db => _ref.read(appDatabaseProvider);
  bool get _online => _ref.read(connectivityProvider).valueOrNull ?? true;

  Future<int?> _deviceVersion(String imei) async =>
      (await _db.deviceDao.findByImei(imei))?.version;

  /// `true` when the write was queued offline (show "pending sync");
  /// `false` when it applied online.
  Future<bool> create({
    required String imei,
    required String partnerId,
    required num agreedPrice,
    required DateTime dueDate,
    String? notes,
  }) async {
    final version = await _deviceVersion(imei);
    final id = newUuidV4();
    final payload = <String, dynamic>{
      'imei': imei,
      'partnerId': partnerId,
      'agreedPrice': agreedPrice,
      'dueDate': dueDate.toUtc().toIso8601String(),
      'notes': ?notes,
      'clientMutationId': id,
      'expectedVersion': ?version,
    };
    return _dispatch(
      rest: () => _repo.create(payload),
      type: 'consignment.create',
      id: id,
      payload: payload,
      version: version,
    );
  }

  Future<bool> settle({
    required String consignmentId,
    required String imei,
    num? salePrice,
    String? notes,
  }) async {
    final version = await _deviceVersion(imei);
    final restBody = <String, dynamic>{
      'salePrice': ?salePrice,
      'notes': ?notes,
    };
    return _dispatch(
      rest: () => _repo.settle(consignmentId, restBody),
      type: 'consignment.settle',
      id: newUuidV4(),
      payload: {'consignmentId': consignmentId, ...restBody},
      version: version,
    );
  }

  Future<bool> returnToStock({
    required String consignmentId,
    required String imei,
    String? reason,
  }) async {
    final version = await _deviceVersion(imei);
    final restBody = <String, dynamic>{'reason': ?reason};
    return _dispatch(
      rest: () => _repo.returnToStock(consignmentId, restBody),
      type: 'consignment.return',
      id: newUuidV4(),
      payload: {'consignmentId': consignmentId, ...restBody},
      version: version,
    );
  }

  Future<bool> _dispatch({
    required Future<void> Function() rest,
    required String type,
    required String id,
    required Map<String, dynamic> payload,
    required int? version,
  }) async {
    if (_online) {
      try {
        await rest();
        _ref.read(syncControllerProvider).syncNow();
        return false;
      } on AppException catch (e) {
        if (!e.isNetwork) rethrow; // validation / credit-limit / conflict
      }
    }
    await _db.outboxDao.enqueue(
      OutboxCompanion.insert(
        id: id,
        type: type,
        payload: jsonEncode(payload),
        baseVersion: Value(version),
        occurredAt: DateTime.now().toUtc().toIso8601String(),
      ),
    );
    _ref.read(syncControllerProvider).syncNow(); // best-effort drain
    return true;
  }
}

final consignmentWriterProvider =
    Provider<ConsignmentWriter>((ref) => ConsignmentWriter(ref));
