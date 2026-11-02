import 'package:decimal/decimal.dart';
import 'package:flutter/material.dart';

import 'package:mobile_erp/shared/lib/money.dart';

import '../../../l10n/i18n.dart';
import '../../../theme/tokens.dart';
import '../data/device.dart';

/// A deterministic faux-barcode drawn from the IMEI (mirrors the web client).
class DeviceBarcode extends StatelessWidget {
  const DeviceBarcode({required this.imei, super.key});

  final String imei;

  @override
  Widget build(BuildContext context) {
    final bars = [
      for (var i = 0; i < 44; i++)
        ((i * 7 + imei.codeUnitAt(i % imei.length)) % 3) + 1,
    ];
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      decoration: BoxDecoration(
        color: AppColors.signalWhite,
        borderRadius: BorderRadius.circular(AppRadii.cards),
        border: Border.all(color: AppColors.bone),
      ),
      child: Column(
        children: [
          SizedBox(
            height: 36,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (final w in bars) ...[
                  Container(width: w * 1.5, color: AppColors.inkBlack),
                  const SizedBox(width: 2),
                ],
              ],
            ),
          ),
          const SizedBox(height: 4),
          Text(imei,
              style: const TextStyle(
                  fontFamily: 'monospace', fontSize: 11, letterSpacing: 2)),
        ],
      ),
    );
  }
}

/// Specs grid plus the cost/margin row (shown only when the caller may view cost).
class DeviceSpecsGrid extends StatelessWidget {
  const DeviceSpecsGrid({
    required this.device,
    required this.canViewCost,
    super.key,
  });

  final DeviceDetail device;
  final bool canViewCost;

  @override
  Widget build(BuildContext context) {
    String spec(String key) => device.specs[key]?.toString() ?? '—';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.mist,
            borderRadius: BorderRadius.circular(AppRadii.cards),
            border: Border.all(color: AppColors.bone),
          ),
          child: Wrap(
            spacing: 24,
            runSpacing: 12,
            children: [
              _SpecCell(context.t('inventory.storage'), spec('storage')),
              _SpecCell(context.t('inventory.color'), spec('color')),
              _SpecCell(context.t('inventory.condition'), spec('condition')),
              _SpecCell(context.t('inventory.ram'), spec('ram')),
              _SpecCell(
                context.t('inventory.targetPrice'),
                formatMoney(device.targetPrice),
              ),
            ],
          ),
        ),
        if (canViewCost && device.landedCost != null) ...[
          const SizedBox(height: 8),
          _MarginRow(targetPrice: device.targetPrice, landedCost: device.landedCost!),
        ],
      ],
    );
  }
}

class _SpecCell extends StatelessWidget {
  const _SpecCell(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelSmall),
        Text(value, style: Theme.of(context).textTheme.bodyMedium),
      ],
    );
  }
}

class _MarginRow extends StatelessWidget {
  const _MarginRow({required this.targetPrice, required this.landedCost});
  final String? targetPrice;
  final String landedCost;

  @override
  Widget build(BuildContext context) {
    final price = parseMoney(targetPrice);
    final cost = parseMoney(landedCost);
    final margin = price - cost;
    final percent =
        cost > Decimal.zero ? (margin / cost).toDouble() * 100 : 0.0;
    final positive = margin >= Decimal.zero;
    final color = positive ? AppColors.success : AppColors.danger;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.signalWhite,
        borderRadius: BorderRadius.circular(AppRadii.cards),
        border: Border.all(color: AppColors.bone),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text('${context.t('inventory.landedCost')}: ${formatMoney(landedCost)}',
              style: Theme.of(context).textTheme.bodySmall),
          Text(
            '${context.t('inventory.margin')}: ${positive ? '+' : ''}'
            '${formatMoney(margin.toString())} (${percent.toStringAsFixed(1)}%)',
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: color, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}

/// Latest QC inspection summary, or a placeholder when none exists.
class QcSummarySection extends StatelessWidget {
  const QcSummarySection({required this.qc, super.key});
  final QcSummary? qc;

  @override
  Widget build(BuildContext context) {
    final summary = qc;
    if (summary == null) {
      return Text(context.t('inventory.noQc'),
          style: Theme.of(context).textTheme.bodyMedium);
    }
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.mist,
        borderRadius: BorderRadius.circular(AppRadii.cards),
        border: Border.all(color: AppColors.bone),
      ),
      child: Column(
        children: [
          _kv(
            context,
            context.t('qc.result'),
            summary.passed ? context.t('qc.passed') : context.t('qc.failed'),
            color: summary.passed ? AppColors.success : AppColors.danger,
          ),
          if (summary.gradeCode != null)
            _kv(context, context.t('qc.grade'), summary.gradeCode!),
          if (summary.batteryHealth != null)
            _kv(context, context.t('qc.batteryHealth'),
                '${summary.batteryHealth}%'),
        ],
      ),
    );
  }

  Widget _kv(BuildContext context, String k, String v, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(k, style: Theme.of(context).textTheme.bodySmall),
          Text(v,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: color, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

/// Scrollable status-history list.
class DeviceHistoryList extends StatelessWidget {
  const DeviceHistoryList({required this.history, super.key});
  final List<DeviceHistoryEntry> history;

  @override
  Widget build(BuildContext context) {
    if (history.isEmpty) {
      return Text('—', style: Theme.of(context).textTheme.bodyMedium);
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final h in history)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${h.fromStatusCode != null ? '${h.fromStatusCode} → ' : ''}${h.toStatusCode}',
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
                if (h.reason != null)
                  Text('"${h.reason}"',
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(fontStyle: FontStyle.italic)),
                Text(h.changedAt, style: Theme.of(context).textTheme.labelSmall),
              ],
            ),
          ),
      ],
    );
  }
}
