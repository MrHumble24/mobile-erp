import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/settings_models.dart';
import '../data/settings_repository.dart';

/// Store settings read + save. The read is the AsyncNotifier state; [save] PUTs
/// the form and swaps in the server's canonical copy.
class SettingsController extends AsyncNotifier<StoreSettings> {
  @override
  Future<StoreSettings> build() => ref.read(settingsRepositoryProvider).get();

  Future<void> save(Map<String, dynamic> dto) async {
    final updated = await ref.read(settingsRepositoryProvider).update(dto);
    state = AsyncData(updated);
  }
}

final settingsControllerProvider =
    AsyncNotifierProvider<SettingsController, StoreSettings>(
  SettingsController.new,
);
