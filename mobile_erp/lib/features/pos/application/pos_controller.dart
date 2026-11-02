import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ids.dart';
import '../../../data/sync/connectivity.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../auth/application/session_controller.dart';
import '../data/pos_models.dart';
import '../data/pos_repository.dart';
import '../data/sale_create.dart';
import 'pending_sales_provider.dart';

/// POS terminal state: the scanned device, a lookup error (an i18n key), the
/// busy flag, and the completed sale that drives the receipt modal.
class PosState {
  const PosState({this.device, this.errorKey, this.busy = false, this.completed});

  final ScannedDevice? device;
  final String? errorKey;
  final bool busy;
  final CompletedSale? completed;

  PosState copyWith({
    ScannedDevice? device,
    String? errorKey,
    bool? busy,
    CompletedSale? completed,
    bool clearDevice = false,
    bool clearError = false,
    bool clearCompleted = false,
  }) =>
      PosState(
        device: clearDevice ? null : (device ?? this.device),
        errorKey: clearError ? null : (errorKey ?? this.errorKey),
        busy: busy ?? this.busy,
        completed: clearCompleted ? null : (completed ?? this.completed),
      );
}

class PosController extends AutoDisposeNotifier<PosState> {
  @override
  PosState build() => const PosState();

  /// Resolve a scanned IMEI and gate it: must exist, be IN_STOCK, and have no
  /// pending offline sale already queued against it.
  Future<void> scan(String imei) async {
    state = state.copyWith(
        busy: true, clearError: true, clearDevice: true, clearCompleted: true);
    try {
      final device = await ref.read(posRepositoryProvider).lookup(imei);
      if (device == null) {
        state = state.copyWith(busy: false, errorKey: 'common.notFound');
        return;
      }
      final pending =
          ref.read(pendingSoldImeisProvider).valueOrNull ?? const <String>{};
      if (pending.contains(device.imei)) {
        state = state.copyWith(busy: false, errorKey: 'pos.alreadyQueued');
        return;
      }
      if (!device.inStock) {
        state = state.copyWith(busy: false, errorKey: 'pos.notInStock');
        return;
      }
      state = state.copyWith(busy: false, device: device);
    } catch (_) {
      state = state.copyWith(busy: false, errorKey: 'common.error');
    }
  }

  void clear() => state = const PosState();

  void dismissReceipt() => state = const PosState();

  /// Create the sale online (`POST /sales`) or, when offline, enqueue it to the
  /// outbox. Either way a [CompletedSale] is produced for the receipt.
  Future<void> checkout({
    required String salePrice,
    String? customerId,
    String? customerName,
    String? customerPhone,
    int? warrantyDays,
    String? notes,
  }) async {
    final device = state.device;
    if (device == null) return;
    state = state.copyWith(busy: true, clearError: true);

    final clientMutationId = newUuidV4();
    final price = parseMoney(salePrice).toDouble();
    final payload = buildSalePayload(
      imei: device.imei,
      salePrice: price,
      clientMutationId: clientMutationId,
      expectedVersion: device.version,
      customerId: customerId,
      customerName: customerName,
      customerPhone: customerPhone,
      warrantyDays: warrantyDays,
      notes: notes,
    );

    final online = ref.read(connectivityProvider).valueOrNull ?? true;
    final now = DateTime.now();
    try {
      String receiptId = clientMutationId;
      final repo = ref.read(posRepositoryProvider);
      if (online) {
        final id = await repo.postSale(payload);
        if (id.isNotEmpty) receiptId = id;
      } else {
        await repo.enqueueSale(
          clientMutationId: clientMutationId,
          payload: payload,
          baseVersion: device.version,
        );
      }
      state = PosState(
        completed: CompletedSale(
          receiptId: receiptId,
          imei: device.imei,
          modelLabel: device.modelLabel,
          salePrice: salePrice,
          soldAt: now,
          cashier: _cashier(),
          warrantyDays: warrantyDays ?? 0,
          warrantyEndsAt:
              warrantyDays == null ? null : now.add(Duration(days: warrantyDays)),
          customerName: customerName,
          pending: !online,
        ),
      );
    } catch (_) {
      state = state.copyWith(busy: false, errorKey: 'common.error');
    }
  }

  String _cashier() {
    final user = ref.read(sessionControllerProvider).valueOrNull;
    return user?.profile?.fullName ?? user?.email ?? '';
  }
}

final posControllerProvider =
    AutoDisposeNotifierProvider<PosController, PosState>(PosController.new);

/// Store default warranty days from `/settings`, to prefill the checkout form.
final defaultWarrantyDaysProvider = FutureProvider.autoDispose<int>(
  (ref) => ref.watch(posRepositoryProvider).defaultWarrantyDays(),
);
