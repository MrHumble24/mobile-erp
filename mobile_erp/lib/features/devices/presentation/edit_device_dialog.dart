import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../data/sync/connectivity.dart';
import '../../../data/sync/sync_controller.dart';
import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../../device_models/device_models_module.dart';
import '../data/device.dart';
import '../data/device_repository.dart';
import '../application/devices_providers.dart';

/// Edit a device's specs (driven by the model's attribute schema) and target
/// price. Online-only; pops `true` on success so the sheet can refresh.
class EditDeviceSheet extends ConsumerStatefulWidget {
  const EditDeviceSheet({required this.device, super.key});

  final DeviceDetail device;

  @override
  ConsumerState<EditDeviceSheet> createState() => _EditDeviceSheetState();
}

class _EditDeviceSheetState extends ConsumerState<EditDeviceSheet> {
  late final Map<String, String> _specs = {
    for (final e in widget.device.specs.entries) e.key: '${e.value}',
  };
  late final TextEditingController _targetPrice =
      TextEditingController(text: widget.device.targetPrice ?? '');
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _targetPrice.dispose();
    super.dispose();
  }

  Map<String, dynamic> _buildSpecs(List<AttributeDef> attrs) {
    final out = <String, dynamic>{};
    for (final attr in attrs) {
      final raw = _specs[attr.key]?.trim() ?? '';
      if (raw.isEmpty) continue;
      out[attr.key] =
          attr.type == AttributeType.number ? num.tryParse(raw) ?? raw : raw;
    }
    return out;
  }

  Future<void> _save(List<AttributeDef> attrs) async {
    setState(() {
      _saving = true;
      _error = null;
    });
    final tp = _targetPrice.text.trim();
    try {
      await ref.read(deviceRepositoryProvider).update(
            widget.device.id,
            specs: _buildSpecs(attrs),
            targetPrice: tp.isEmpty ? null : double.tryParse(tp),
          );
      ref.invalidate(deviceDetailProvider(widget.device.imei));
      ref.read(syncControllerProvider).syncNow();
      if (mounted) Navigator.of(context).pop(true);
    } on AppException catch (e) {
      setState(() {
        _saving = false;
        _error = e.message;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final attrsAsync = ref.watch(modelAttributesProvider(widget.device.modelId));
    final online = ref.watch(connectivityProvider).valueOrNull ?? true;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(context.t('inventory.editDevice'),
              style: Theme.of(context).textTheme.titleLarge),
          Text(widget.device.imei,
              style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 16),
          attrsAsync.when(
            loading: () => const Padding(
              padding: EdgeInsets.all(24),
              child: Loading(),
            ),
            error: (e, _) => ErrorView(
              message: e.toString(),
              onRetry: () =>
                  ref.invalidate(modelAttributesProvider(widget.device.modelId)),
              retryLabel: context.t('common.retry'),
            ),
            data: (attrs) => Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                DynamicSpecFields(
                  attributes: attrs,
                  values: _specs,
                  onChanged: (k, v) => setState(() => _specs[k] = v),
                ),
                AppFormField(
                  label: context.t('inventory.targetPrice'),
                  controller: _targetPrice,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!,
                      style: TextStyle(
                          color: Theme.of(context).colorScheme.error)),
                ],
                if (!online) ...[
                  const SizedBox(height: 12),
                  Text(context.t('common.offline'),
                      style: Theme.of(context).textTheme.bodySmall),
                ],
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: (!online || _saving) ? null : () => _save(attrs),
                  child: Text(_saving
                      ? context.t('common.loading')
                      : context.t('common.save')),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
