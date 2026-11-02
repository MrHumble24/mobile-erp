import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'database.dart';

/// The single [AppDatabase] instance. Feature repositories read it to run their
/// own reactive queries against the cached tables.
final appDatabaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(db.close);
  return db;
});
