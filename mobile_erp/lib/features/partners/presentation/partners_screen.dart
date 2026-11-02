import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/local/database.dart';
import '../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../shared/ui/ui.dart';
import '../../auth/application/permissions.dart';
import '../application/partner_providers.dart';
import 'create_partner_dialog.dart';
import 'partner_ledger_sheet.dart';
import 'record_payment_dialog.dart';

/// Partner directory with balances (offline-first from the Drift cache). Each
/// row opens a ledger drawer and — for `partner.payment` holders — a payment
/// dialog. `partner.manage` holders can add a partner.
class PartnersScreen extends ConsumerWidget {
  const PartnersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final partners = ref.watch(partnersStreamProvider);
    final can = ref.watch(canProvider);

    return Scaffold(
      floatingActionButton: can('partner.manage')
          ? FloatingActionButton.extended(
              onPressed: () => showCreatePartnerDialog(context),
              icon: const Icon(Icons.add),
              label: Text(context.t('partners.newPartner')),
            )
          : null,
      body: partners.when(
        loading: () => const Loading(),
        error: (e, _) => ErrorView(
          message: context.t('common.error'),
          onRetry: () => ref.invalidate(partnersStreamProvider),
          retryLabel: context.t('common.retry'),
        ),
        data: (rows) => rows.isEmpty
            ? EmptyView(message: context.t('partners.noPartnersFound'))
            : _PartnersTable(rows: rows, canPay: can('partner.payment')),
      ),
    );
  }
}

class _PartnersTable extends StatelessWidget {
  const _PartnersTable({required this.rows, required this.canPay});

  final List<Partner> rows;
  final bool canPay;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: AppDataTable<Partner>(
        columns: [
          context.t('partners.name'),
          context.t('partners.phone'),
          context.t('partners.creditLimit'),
          context.t('partners.outstanding'),
          context.t('common.actions'),
        ],
        rows: rows,
        cells: (p) => [
          Text(p.shopName),
          Text(p.phone ?? '—'),
          Text(_limit(p.creditLimit)),
          Text(formatMoney(p.outstanding)),
          _RowActions(partner: p, canPay: canPay),
        ],
      ),
    );
  }

  String _limit(String value) =>
      parseMoney(value) == parseMoney('0') ? '∞' : formatMoney(value);
}

class _RowActions extends StatelessWidget {
  const _RowActions({required this.partner, required this.canPay});

  final Partner partner;
  final bool canPay;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          tooltip: context.t('partners.ledgerTitle'),
          icon: const Icon(Icons.history),
          onPressed: () => showPartnerLedgerSheet(context, partner),
        ),
        if (canPay)
          IconButton(
            tooltip: context.t('partners.recordPayment'),
            icon: const Icon(Icons.payments_outlined),
            onPressed: () => showRecordPaymentDialog(context, partner),
          ),
      ],
    );
  }
}
