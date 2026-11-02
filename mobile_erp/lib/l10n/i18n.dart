import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// The 15 translation namespaces bundled under `assets/l10n/<locale>/`.
/// Same files as the web client — do not re-author Uzbek here.
const _namespaces = [
  'auth', 'common', 'consignments', 'dashboard', 'expenses',
  'inventory', 'nav', 'partners', 'pos', 'qc',
  'reports', 'sales', 'settings', 'shipments', 'users',
];

const _locales = ['uz', 'en'];
const defaultLocale = 'uz';

/// locale → namespace → key → value, loaded once at startup.
typedef Bundles = Map<String, Map<String, Map<String, String>>>;

/// Loads every namespace for every locale from assets.
Future<Bundles> loadBundles() async {
  final result = <String, Map<String, Map<String, String>>>{};
  for (final locale in _locales) {
    final byNs = <String, Map<String, String>>{};
    for (final ns in _namespaces) {
      final raw = await rootBundle.loadString('assets/l10n/$locale/$ns.json');
      final map = (jsonDecode(raw) as Map).cast<String, dynamic>();
      byNs[ns] = map.map((k, v) => MapEntry(k, v.toString()));
    }
    result[locale] = byNs;
  }
  return result;
}

/// A locale-bound view over the loaded bundles. Lookup key is `namespace.key`;
/// `{param}` placeholders are interpolated; a missing key returns the raw key.
class I18n {
  const I18n(this._bundles, this.locale);

  final Bundles _bundles;
  final String locale;

  String t(String key, [Map<String, Object?>? params]) {
    final dot = key.indexOf('.');
    if (dot < 0) return key;
    final ns = key.substring(0, dot);
    final name = key.substring(dot + 1);
    // locale → default (uz) → en → raw key. The en fallback keeps a newly
    // added key readable until Gemini supplies the Uzbek copy.
    final text = _bundles[locale]?[ns]?[name] ??
        _bundles[defaultLocale]?[ns]?[name] ??
        _bundles['en']?[ns]?[name];
    if (text == null) return key;
    return _interpolate(text, params);
  }

  String _interpolate(String text, Map<String, Object?>? params) {
    if (params == null || params.isEmpty) return text;
    var out = text;
    params.forEach((k, v) => out = out.replaceAll('{$k}', '${v ?? ''}'));
    return out;
  }
}

/// Holds the loaded bundles. Overridden in `main()` after [loadBundles].
final bundlesProvider = Provider<Bundles>(
  (ref) => throw StateError('bundlesProvider must be overridden at startup'),
);

/// Current UI locale. Client-only state; defaults to Uzbek.
final localeProvider = NotifierProvider<LocaleController, String>(
  LocaleController.new,
);

class LocaleController extends Notifier<String> {
  @override
  String build() => defaultLocale;
  void set(String locale) => state = locale;
}

/// The active [I18n] view. Rebuilds when the locale changes.
final i18nProvider = Provider<I18n>(
  (ref) => I18n(ref.watch(bundlesProvider), ref.watch(localeProvider)),
);

/// `context.t('nav.pos')` — convenience lookup without a subscription.
/// Widgets that must rebuild on locale change should `ref.watch(i18nProvider)`.
extension I18nContext on BuildContext {
  String t(String key, [Map<String, Object?>? params]) =>
      ProviderScope.containerOf(this, listen: false).read(i18nProvider).t(key, params);
}
