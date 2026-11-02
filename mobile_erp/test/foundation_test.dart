import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_erp/core/ids.dart';
import 'package:mobile_erp/l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';

void main() {
  test('money parses Decimal strings defensively and formats with grouping', () {
    expect(parseMoney(null).toString(), '0');
    expect(parseMoney('garbage').toString(), '0');
    expect(parseMoney('1250000.50').toString(), '1250000.5');
    expect(formatMoney('1250000'), contains('\$'));
    // grouped to thousands (locale separator may vary, digits must survive)
    expect(formatMoney('1250000').replaceAll(RegExp(r'[^0-9]'), ''), '1250000');
  });

  test('uuid v4 has the right shape and version/variant nibbles', () {
    final id = newUuidV4();
    expect(id, matches(RegExp(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')));
    expect(newUuidV4(), isNot(id)); // not a constant
  });

  test('i18n looks up namespace.key, interpolates, falls back to raw key', () {
    const bundles = {
      'uz': {
        'nav': {'pos': 'Kassa'},
        'common': {'greet': 'Salom {name}'},
      },
      'en': {
        'common': {'onlyEn': 'English only'},
      },
    };
    const i18n = I18n(bundles, 'uz');
    expect(i18n.t('nav.pos'), 'Kassa');
    expect(i18n.t('common.greet', {'name': 'Ali'}), 'Salom Ali');
    expect(i18n.t('common.onlyEn'), 'English only'); // uz-missing → en fallback
    expect(i18n.t('common.missing'), 'common.missing'); // raw key
    expect(i18n.t('nodot'), 'nodot');
  });
}
