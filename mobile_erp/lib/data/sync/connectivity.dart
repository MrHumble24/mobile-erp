import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

bool _isOnline(List<ConnectivityResult> r) =>
    r.any((e) => e != ConnectivityResult.none);

/// `true` when the device has any network transport. Drives the sync controller
/// and the offline banner. Feature screens that gate online-only writes watch this.
final connectivityProvider = StreamProvider<bool>((ref) async* {
  final conn = Connectivity();
  yield _isOnline(await conn.checkConnectivity());
  yield* conn.onConnectivityChanged.map(_isOnline);
});
