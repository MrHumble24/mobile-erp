import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_erp/core/jwt.dart';

String _jwt(Map<String, dynamic> payload) {
  String seg(Object o) =>
      base64Url.encode(utf8.encode(jsonEncode(o))).replaceAll('=', '');
  return '${seg({'alg': 'HS256'})}.${seg(payload)}.sig';
}

void main() {
  final now = DateTime.utc(2026, 1, 1, 12);

  test('expired token → expired', () {
    final t = _jwt({'exp': now.subtract(const Duration(hours: 1)).millisecondsSinceEpoch ~/ 1000});
    expect(isJwtExpired(t, now: now), isTrue);
  });

  test('future token → not expired', () {
    final t = _jwt({'exp': now.add(const Duration(hours: 1)).millisecondsSinceEpoch ~/ 1000});
    expect(isJwtExpired(t, now: now), isFalse);
  });

  test('malformed token → expired', () {
    expect(isJwtExpired('not-a-jwt', now: now), isTrue);
  });
}
