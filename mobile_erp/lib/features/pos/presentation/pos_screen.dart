import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../application/pos_controller.dart';
import 'pos_cart_card.dart';
import 'pos_checkout_form.dart';
import 'pos_receipt_modal.dart';

/// POS terminal: scan an IMEI → review the device → checkout. Works offline
/// (device lookup from Drift, sale queued to the outbox). A completed sale opens
/// the receipt modal and resets for the next scan.
class PosScreen extends ConsumerWidget {
  const PosScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(posControllerProvider);

    ref.listen(posControllerProvider.select((s) => s.completed), (_, sale) {
      if (sale == null) return;
      showAppBottomSheet<void>(
        context,
        builder: (_) => SizedBox(
          height: MediaQuery.sizeOf(context).height * 0.85,
          child: SingleChildScrollView(child: PosReceiptModal(sale: sale)),
        ),
      ).whenComplete(() {
        if (ref.read(posControllerProvider).completed != null) {
          ref.read(posControllerProvider.notifier).dismissReceipt();
        }
      });
    });

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(context.t('pos.title'),
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          ScannerField(
            hintText: context.t('pos.scanPrompt'),
            onScan: (imei) =>
                ref.read(posControllerProvider.notifier).scan(imei),
          ),
          const SizedBox(height: 16),
          if (state.busy && state.device == null)
            const Padding(padding: EdgeInsets.all(24), child: Loading())
          else if (state.errorKey != null)
            _Message(text: context.t(state.errorKey!))
          else if (state.device == null)
            _Message(text: context.t('pos.cartEmpty'))
          else ...[
            PosCartCard(device: state.device!),
            const SizedBox(height: 16),
            PosCheckoutForm(device: state.device!),
          ],
        ],
      ),
    );
  }
}

class _Message extends StatelessWidget {
  const _Message({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: EmptyView(message: text, icon: Icons.qr_code_scanner),
      );
}
