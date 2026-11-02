part of 'database.dart';

/// The offline mutation queue. The push drain reads [watchPending]/[pending],
/// then marks each entry applied (delete), conflict, or rejected.
@DriftAccessor(tables: [Outbox])
class OutboxDao extends DatabaseAccessor<AppDatabase> with _$OutboxDaoMixin {
  OutboxDao(super.db);

  Stream<List<OutboxData>> watchAll() =>
      (select(outbox)..orderBy([(o) => OrderingTerm.asc(o.occurredAt)])).watch();

  /// Entries still eligible to send (pending or previously rejected-retryable).
  Future<List<OutboxData>> pending() => (select(outbox)
        ..where((o) => o.status.equals('pending'))
        ..orderBy([(o) => OrderingTerm.asc(o.occurredAt)]))
      .get();

  Future<void> enqueue(OutboxCompanion entry) =>
      into(outbox).insert(entry, mode: InsertMode.insertOrReplace);

  Future<void> remove(String id) =>
      (delete(outbox)..where((o) => o.id.equals(id))).go();

  Future<void> markStatus(String id, String status, {String? error}) =>
      (update(outbox)..where((o) => o.id.equals(id))).write(
        OutboxCompanion(
          status: Value(status),
          lastError: Value(error),
        ),
      );
}
