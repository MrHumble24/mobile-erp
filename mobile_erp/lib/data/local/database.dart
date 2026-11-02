import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

import 'tables.dart';

part 'database.g.dart';
part 'device_dao.dart';
part 'partner_dao.dart';
part 'outbox_dao.dart';
part 'sync_meta_dao.dart';

/// The offline cache. One SQLite file (`malika_erp`). Schema is owned by this
/// package's integrator — feature agents READ these tables (write their own
/// queries against them) and must request a new table rather than add one.
@DriftDatabase(
  tables: [Devices, Partners, Outbox, SyncMeta],
  daos: [DeviceDao, PartnerDao, OutboxDao, SyncMetaDao],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase([QueryExecutor? executor])
      : super(executor ?? driftDatabase(name: 'malika_erp'));

  @override
  int get schemaVersion => 1;
}
