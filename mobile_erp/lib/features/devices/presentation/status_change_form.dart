import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../data/sync/connectivity.dart';
import '../../../data/sync/sync_controller.dart';
import '../../../l10n/i18n.dart';
import '../data/device.dart';
import '../data/device_repository.dart';
import '../data/device_status.dart';
import '../application/devices_providers.dart';

/// Manual status-change form inside the device sheet. Online-only (not an
/// outbox mutation): disabled when offline. Surfaces the 409 version-conflict.
class StatusChangeForm extends ConsumerStatefulWidget {
  const StatusChangeForm({required this.device, super.key});

  final DeviceDetail device;

  @override
  ConsumerState<StatusChangeForm> createState() => _StatusChangeFormState();
}

class _StatusChangeFormState extends ConsumerState<StatusChangeForm> {
  final _reason = TextEditingController();
  String? _target;
  bool _saving = false;

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final target = _target;
    if (target == null) return;
    setState(() => _saving = true);
    final messenger = ScaffoldMessenger.of(context);
    final i18n = ref.read(i18nProvider);
    try {
      await ref.read(deviceRepositoryProvider).changeStatus(
            widget.device.id,
            toStatusCode: target,
            expectedVersion: widget.device.version,
            reason: _reason.text.trim(),
          );
      ref.invalidate(deviceDetailProvider(widget.device.imei));
      ref.invalidate(deviceHistoryProvider(widget.device.id));
      ref.read(syncControllerProvider).syncNow();
      messenger.showSnackBar(
        SnackBar(content: Text(i18n.t('common.success'))),
      );
    } on AppException catch (e) {
      final msg = e.statusCode == 409
          ? i18n.t('inventory.versionConflict')
          : e.message;
      if (e.statusCode == 409) {
        ref.invalidate(deviceDetailProvider(widget.device.imei));
      }
      messenger.showSnackBar(SnackBar(content: Text(msg)));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final transitions = DeviceStatusMeta.transitionsFor(widget.device.statusCode);
    if (transitions.isEmpty) return const SizedBox.shrink();
    _target ??= transitions.first;
    final online = ref.watch(connectivityProvider).valueOrNull ?? true;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Divider(height: 24),
        Text(context.t('inventory.changeStatus'),
            style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 4),
        Text(context.t('inventory.statusManualHint'),
            style: Theme.of(context).textTheme.bodySmall),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: _target,
          decoration:
              InputDecoration(labelText: context.t('inventory.newStatus')),
          items: [
            for (final s in transitions)
              DropdownMenuItem(
                value: s,
                child: Text(context.t(DeviceStatusMeta.labelKey(s))),
              ),
          ],
          onChanged: (v) => setState(() => _target = v),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _reason,
          decoration: InputDecoration(labelText: context.t('inventory.reason')),
        ),
        const SizedBox(height: 12),
        if (!online)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(context.t('common.offline'),
                style: Theme.of(context).textTheme.bodySmall),
          ),
        FilledButton(
          onPressed: (!online || _saving) ? null : _submit,
          child: Text(_saving
              ? context.t('common.loading')
              : context.t('common.save')),
        ),
      ],
    );
  }
}
