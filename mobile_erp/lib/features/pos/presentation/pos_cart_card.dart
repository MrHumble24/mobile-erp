import 'package:flutter/material.dart';

import '../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../shared/ui/ui.dart';
import '../../../theme/tokens.dart';
import '../data/pos_models.dart';

/// The scanned device shown as a cart card above the checkout form.
class PosCartCard extends StatelessWidget {
  const PosCartCard({required this.device, super.key});

  final ScannedDevice device;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(context.t('pos.deviceCard'), style: text.labelLarge),
              ),
              StatusChip(device.statusCode, color: AppColors.success),
            ],
          ),
          const SizedBox(height: 8),
          Text(device.modelLabel, style: text.titleMedium),
          Text(device.imei, style: text.bodySmall),
          if (device.targetPrice != null) ...[
            const SizedBox(height: 8),
            Text(formatMoney(device.targetPrice), style: text.titleSmall),
          ],
        ],
      ),
    );
  }
}
