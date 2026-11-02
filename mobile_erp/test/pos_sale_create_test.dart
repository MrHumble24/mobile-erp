import 'dart:convert';

import 'package:drift/drift.dart' show Value;
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_erp/features/pos/data/sale_create.dart';

void main() {
  test('buildSalePayload sends a clean DTO with mutation id + expectedVersion', () {
    final p = buildSalePayload(
      imei: '123456789012345', salePrice: 2500000,
      clientMutationId: 'cmid-1', expectedVersion: 7,
      customerName: ' Ali ', customerPhone: '', warrantyDays: 14, notes: '  ',
    );
    expect(p['salePrice'], 2500000);
    expect(p['clientMutationId'], 'cmid-1');
    expect(p['expectedVersion'], 7);
    expect(p['customer'], {'name': 'Ali'});
    expect(p.containsKey('notes'), isFalse);
    expect(p.containsKey('customerId'), isFalse);
  });

  test('customerId wins over an inline customer', () {
    final p = buildSalePayload(
      imei: '123456789012345', salePrice: 1, clientMutationId: 'x',
      expectedVersion: 0, customerId: 'cust-9', customerName: 'Ignored',
    );
    expect(p['customerId'], 'cust-9');
    expect(p.containsKey('customer'), isFalse);
  });

  test('buildSaleOutboxEntry produces the right offline row', () {
    final payload = buildSalePayload(
      imei: '123456789012345', salePrice: 500,
      clientMutationId: 'cmid-2', expectedVersion: 3,
    );
    final entry = buildSaleOutboxEntry(
      clientMutationId: 'cmid-2', payload: payload, baseVersion: 3,
      occurredAt: DateTime.utc(2026, 1, 1),
    );
    expect(entry.id, const Value('cmid-2'));
    expect(entry.type, const Value('sale.create'));
    expect(entry.baseVersion, const Value(3));
    expect(entry.occurredAt, Value('2026-01-01T00:00:00.000Z'));
    final decoded = jsonDecode(entry.payload.value) as Map<String, dynamic>;
    expect(decoded['clientMutationId'], 'cmid-2');
    expect(decoded['expectedVersion'], 3);
  });
}
