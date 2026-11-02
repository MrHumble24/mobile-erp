import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';
import 'core/dev_config.dart';
import 'l10n/i18n.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Preload translations so `context.t` is synchronous everywhere, and the
  // persisted API config so dio starts on the right environment.
  final bundles = await loadBundles();
  final devConfig = await loadDevConfig();
  runApp(
    ProviderScope(
      overrides: [
        bundlesProvider.overrideWithValue(bundles),
        initialDevConfigProvider.overrideWithValue(devConfig),
      ],
      child: const MalikaApp(),
    ),
  );
}
