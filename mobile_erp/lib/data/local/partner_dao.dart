part of 'database.dart';

/// Reactive access to cached [Partners].
@DriftAccessor(tables: [Partners])
class PartnerDao extends DatabaseAccessor<AppDatabase> with _$PartnerDaoMixin {
  PartnerDao(super.db);

  Stream<List<Partner>> watchAll() =>
      (select(partners)..orderBy([(p) => OrderingTerm.asc(p.shopName)])).watch();

  Future<void> upsertAll(Iterable<PartnersCompanion> rows) =>
      batch((b) => b.insertAllOnConflictUpdate(partners, rows.toList()));

  Future<void> clear() => delete(partners).go();
}
