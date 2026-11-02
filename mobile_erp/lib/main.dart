import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';
import 'l10n/i18n.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Preload translations so `context.t` is synchronous everywhere.
  final bundles = await loadBundles();
  runApp(
    ProviderScope(
      overrides: [bundlesProvider.overrideWithValue(bundles)],
      child: const MalikaApp(),
    ),
  );
}
