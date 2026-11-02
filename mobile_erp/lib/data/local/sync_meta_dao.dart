part of 'database.dart';

/// Key/value scratchpad for sync bookkeeping (the `/sync/changes` cursor).
@DriftAccessor(tables: [SyncMeta])
class SyncMetaDao extends DatabaseAccessor<AppDatabase> with _$SyncMetaDaoMixin {
  SyncMetaDao(super.db);

  Future<String?> get(String key) async {
    final row = await (select(syncMeta)..where((m) => m.key.equals(key)))
        .getSingleOrNull();
    return row?.value;
  }

  Future<void> set(String key, String value) => into(syncMeta).insert(
        SyncMetaCompanion.insert(key: key, value: value),
        mode: InsertMode.insertOrReplace,
      );
}
