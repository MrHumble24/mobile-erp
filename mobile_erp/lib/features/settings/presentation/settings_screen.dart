import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../data/sync/connectivity.dart';
import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../application/settings_controller.dart';
import '../data/settings_models.dart';

/// Store-settings screen: one form → `PUT /settings`. Online-only write.
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsControllerProvider);
    return settings.when(
      loading: () => const Loading(),
      error: (e, _) => ErrorView(
        message: e is AppException ? e.message : '$e',
        retryLabel: context.t('common.retry'),
        onRetry: () => ref.invalidate(settingsControllerProvider),
      ),
      data: (s) => _SettingsForm(initial: s),
    );
  }
}

class _SettingsForm extends ConsumerStatefulWidget {
  const _SettingsForm({required this.initial});
  final StoreSettings initial;

  @override
  ConsumerState<_SettingsForm> createState() => _SettingsFormState();
}

class _SettingsFormState extends ConsumerState<_SettingsForm> {
  final _formKey = GlobalKey<FormState>();
  late final _telegram = TextEditingController(text: widget.initial.telegramChatId ?? '');
  late final _closing = TextEditingController(text: widget.initial.closingTime);
  late final _warranty =
      TextEditingController(text: '${widget.initial.defaultWarrantyDays}');
  late final _margin = TextEditingController(text: widget.initial.minMarginPercent);
  late final _lowStock =
      TextEditingController(text: '${widget.initial.lowStockThreshold}');
  bool _busy = false;

  @override
  void dispose() {
    _telegram.dispose();
    _closing.dispose();
    _warranty.dispose();
    _margin.dispose();
    _lowStock.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() != true) return;
    setState(() => _busy = true);
    try {
      await ref.read(settingsControllerProvider.notifier).save({
        'telegramChatId':
            _telegram.text.trim().isEmpty ? null : _telegram.text.trim(),
        'closingTime': _closing.text.trim(),
        'defaultWarrantyDays': int.parse(_warranty.text.trim()),
        'minMarginPercent': num.parse(_margin.text.trim()),
        'lowStockThreshold': int.parse(_lowStock.text.trim()),
      });
      if (mounted) _snack(context.t('settings.settingsSaved'));
    } catch (e) {
      if (mounted) {
        _snack(e is AppException ? e.message : context.t('common.error'),
            error: true);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _snack(String msg, {bool error = false}) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text(msg),
        backgroundColor: error ? Theme.of(context).colorScheme.error : null,
      ));
  }

  @override
  Widget build(BuildContext context) {
    final online = ref.watch(connectivityProvider).valueOrNull ?? true;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: AppCard(
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(context.t('settings.storeSettings'),
                      style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 16),
                  AppFormField(
                    label: context.t('settings.telegramChatId'),
                    controller: _telegram,
                    hintText: '-1001234567890',
                    enabled: !_busy,
                  ),
                  const SizedBox(height: 12),
                  AppFormField(
                    label: context.t('settings.closingTime'),
                    controller: _closing,
                    hintText: '20:00',
                    enabled: !_busy,
                    validator: (v) =>
                        RegExp(r'^([01]\d|2[0-3]):[0-5]\d$').hasMatch(v ?? '')
                            ? null
                            : context.t('common.required'),
                  ),
                  const SizedBox(height: 12),
                  AppFormField(
                    label: context.t('settings.defaultWarrantyDays'),
                    controller: _warranty,
                    keyboardType: TextInputType.number,
                    enabled: !_busy,
                    validator: _nonNegativeInt,
                  ),
                  const SizedBox(height: 12),
                  AppFormField(
                    label: context.t('settings.minMarginPercent'),
                    controller: _margin,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    enabled: !_busy,
                    validator: _percent,
                  ),
                  const SizedBox(height: 12),
                  AppFormField(
                    label: context.t('settings.lowStockThreshold'),
                    controller: _lowStock,
                    keyboardType: TextInputType.number,
                    enabled: !_busy,
                    validator: _nonNegativeInt,
                  ),
                  if (!online) ...[
                    const SizedBox(height: 12),
                    Text(context.t('common.offline'),
                        style: Theme.of(context).textTheme.bodySmall),
                  ],
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: (_busy || !online) ? null : _submit,
                    child: Text(_busy
                        ? context.t('settings.saving')
                        : context.t('common.save')),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  String? _nonNegativeInt(String? v) {
    final n = int.tryParse(v?.trim() ?? '');
    return (n == null || n < 0) ? context.t('common.required') : null;
  }

  String? _percent(String? v) {
    final n = num.tryParse(v?.trim() ?? '');
    return (n == null || n < 0 || n > 100) ? context.t('common.required') : null;
  }
}
