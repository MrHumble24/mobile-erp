import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/local/database.dart';
import '../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../shared/ui/ui.dart';
import '../../../theme/tokens.dart';
import '../application/partner_providers.dart';
import '../data/partner_ledger.dart';

/// Chronological ledger drawer for a partner (`GET /partners/:id/ledger`).
Future<void> showPartnerLedgerSheet(BuildContext context, Partner partner) =>
    showAppBottomSheet<void>(
      context,
      builder: (_) => _LedgerSheet(partner: partner),
    );

class _LedgerSheet extends ConsumerWidget {
  const _LedgerSheet({required this.partner});
  final Partner partner;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ledger = ref.watch(partnerLedgerProvider(partner.id));
    final text = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(partner.shopName, style: text.titleLarge),
          const SizedBox(height: 2),
          Text(
            '${context.t('partners.outstanding')}: ${formatMoney(partner.outstanding)}',
            style: text.bodyMedium,
          ),
          const SizedBox(height: 16),
          Text(context.t('partners.ledgerTitle'), style: text.titleMedium),
          const SizedBox(height: 8),
          ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.sizeOf(context).height * 0.5,
            ),
            child: ledger.when(
              loading: () => const Padding(
                padding: EdgeInsets.all(24),
                child: Loading(),
              ),
              error: (e, _) => ErrorView(
                message: context.t('common.error'),
                onRetry: () => ref.invalidate(partnerLedgerProvider(partner.id)),
                retryLabel: context.t('common.retry'),
              ),
              data: (entries) => entries.isEmpty
                  ? EmptyView(message: context.t('partners.noLedgerEntries'))
                  : ListView.separated(
                      shrinkWrap: true,
                      itemCount: entries.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 8),
                      itemBuilder: (_, i) => _LedgerRow(entry: entries[i]),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LedgerRow extends StatelessWidget {
  const _LedgerRow({required this.entry});
  final LedgerEntry entry;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final color = entry.isPayment ? AppColors.success : AppColors.warning;
    final sign = entry.isPayment ? '−' : '+';
    return AppCard(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              StatusChip(
                entry.isPayment
                    ? context.t('partners.kindPayment')
                    : context.t('partners.kindConsignment'),
                color: color,
              ),
              Text('$sign${formatMoney(parseMoney(entry.change).abs().toString())}',
                  style: text.titleSmall?.copyWith(color: color)),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(entry.at.toLocal().toString().split('.').first,
                  style: text.bodySmall),
              Text(
                '${context.t('partners.runningBalance')}: ${formatMoney(entry.runningBalance)}',
                style: text.bodySmall,
              ),
            ],
          ),
          if (entry.notes != null && entry.notes!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(entry.notes!, style: text.bodySmall),
          ],
        ],
      ),
    );
  }
}
