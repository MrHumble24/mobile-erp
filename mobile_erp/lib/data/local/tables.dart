import 'package:drift/drift.dart';

/// Cached devices from `/sync/changes`. Cost fields are intentionally absent —
/// the server redacts them from the feed for under-privileged users, so they
/// are never part of the offline cache. JSON blobs (`specs`, `latestSale`) are
/// stored as text and decoded on read.
class Devices extends Table {
  TextColumn get id => text()();
  TextColumn get imei => text()();
  TextColumn get statusCode => text()();
  IntColumn get version => integer()();
  TextColumn get targetPrice => text().nullable()(); // Decimal string
  TextColumn get specs => text().withDefault(const Constant('{}'))();
  TextColumn get modelId => text()();
  TextColumn get modelBrand => text()();
  TextColumn get modelName => text()();
  TextColumn get latestSale => text().nullable()(); // JSON
  TextColumn get gradeCode => text().nullable()();
  TextColumn get inspectionNotes => text().nullable()();
  TextColumn get updatedAt => text()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Cached partners from `/sync/changes`. Money columns are Decimal strings.
class Partners extends Table {
  TextColumn get id => text()();
  TextColumn get shopName => text()();
  TextColumn get phone => text().nullable()();
  TextColumn get creditLimit => text()();
  TextColumn get outstanding => text()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Queued offline mutations awaiting `/sync/push`. Only the 4 server-registered
/// types are ever written here (`sale.create`, `consignment.create/settle/return`).
/// `status`: pending | conflict | rejected.
class Outbox extends Table {
  TextColumn get id => text()(); // client UUID, also the push mutation id
  TextColumn get type => text()();
  TextColumn get payload => text()(); // JSON
  IntColumn get baseVersion => integer().nullable()();
  TextColumn get occurredAt => text()(); // ISO-8601
  TextColumn get status => text().withDefault(const Constant('pending'))();
  TextColumn get lastError => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Single-row-per-key scratchpad for sync bookkeeping (the `/sync/changes`
/// cursor lives here under [SyncMetaKeys.cursor]).
class SyncMeta extends Table {
  TextColumn get key => text()();
  TextColumn get value => text()();

  @override
  Set<Column> get primaryKey => {key};
}

class SyncMetaKeys {
  SyncMetaKeys._();
  static const cursor = 'changes_cursor';
}
