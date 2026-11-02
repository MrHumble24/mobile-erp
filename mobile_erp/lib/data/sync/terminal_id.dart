import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/ids.dart';
import '../../core/secure_storage.dart';

/// This device's stable `terminalId`, sent with every `/sync/push`.
/// Generated once and persisted in secure storage.
final terminalIdProvider = FutureProvider<String>((ref) async {
  final storage = ref.watch(secureStorageProvider);
  final existing = await storage.read(key: SecureKeys.terminalId);
  if (existing != null && existing.isNotEmpty) return existing;
  final fresh = newUuidV4();
  await storage.write(key: SecureKeys.terminalId, value: fresh);
  return fresh;
});
