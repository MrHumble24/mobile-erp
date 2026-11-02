part of 'database.dart';

/// Reactive access to cached [Devices]. `watch*` methods emit on every change.
@DriftAccessor(tables: [Devices])
class DeviceDao extends DatabaseAccessor<AppDatabase> with _$DeviceDaoMixin {
  DeviceDao(super.db);

  Stream<List<Device>> watchAll() =>
      (select(devices)..orderBy([(d) => OrderingTerm.asc(d.imei)])).watch();

  Future<Device?> findByImei(String imei) =>
      (select(devices)..where((d) => d.imei.equals(imei))).getSingleOrNull();

  Future<void> upsertAll(Iterable<DevicesCompanion> rows) =>
      batch((b) => b.insertAllOnConflictUpdate(devices, rows.toList()));

  Future<void> clear() => delete(devices).go();
}
