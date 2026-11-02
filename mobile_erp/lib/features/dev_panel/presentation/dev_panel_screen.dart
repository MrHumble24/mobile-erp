import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/dev_config.dart';
import '../../../l10n/i18n.dart';
import '../../../shared/ui/app_form_field.dart';

/// Access code for the hidden dev panel.
/// ponytail: a client-side gate to keep the panel out of casual reach — it is
/// not a security boundary. Anything truly sensitive stays server-side.
const _devPanelCode = '153535';

/// Hidden developer panel, reachable from the login screen without signing in
/// (`/dev`, a public route). Behind the access code it lets you switch the
/// backend environment and edit each environment's API base URL.
class DevPanelScreen extends ConsumerStatefulWidget {
  const DevPanelScreen({super.key});

  @override
  ConsumerState<DevPanelScreen> createState() => _DevPanelScreenState();
}

class _DevPanelScreenState extends ConsumerState<DevPanelScreen> {
  final _code = TextEditingController();
  final _prodUrl = TextEditingController();
  final _devUrl = TextEditingController();
  late AppEnv _env;
  bool _unlocked = false;
  bool _codeError = false;

  @override
  void initState() {
    super.initState();
    final cfg = ref.read(devConfigProvider);
    _env = cfg.env;
    _prodUrl.text = cfg.prodUrl;
    _devUrl.text = cfg.devUrl;
  }

  @override
  void dispose() {
    _code.dispose();
    _prodUrl.dispose();
    _devUrl.dispose();
    super.dispose();
  }

  void _unlock() {
    final ok = _code.text.trim() == _devPanelCode;
    setState(() {
      _unlocked = ok;
      _codeError = !ok;
    });
  }

  Future<void> _save() async {
    await ref.read(devConfigProvider.notifier).save(
          env: _env,
          prodUrl: _prodUrl.text,
          devUrl: _devUrl.text,
        );
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(context.t('auth.devSaved'))));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(context.t('auth.devPanelTitle')),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.go('/login'),
        ),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: _unlocked ? _form(context) : _gate(context),
          ),
        ),
      ),
    );
  }

  Widget _gate(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppFormField(
          label: context.t('auth.devPanelPassword'),
          controller: _code,
          obscureText: true,
          keyboardType: TextInputType.number,
          textInputAction: TextInputAction.done,
          onFieldSubmitted: (_) => _unlock(),
        ),
        if (_codeError) ...[
          const SizedBox(height: 8),
          Text(
            context.t('auth.devPanelWrongPassword'),
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: Theme.of(context).colorScheme.error),
          ),
        ],
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _unlock,
          child: Text(context.t('auth.devPanelUnlock')),
        ),
      ],
    );
  }

  Widget _form(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(context.t('auth.devEnvironment'),
            style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        SegmentedButton<AppEnv>(
          segments: [
            ButtonSegment(
              value: AppEnv.production,
              label: Text(context.t('auth.envProduction')),
              icon: const Icon(Icons.cloud),
            ),
            ButtonSegment(
              value: AppEnv.development,
              label: Text(context.t('auth.envDevelopment')),
              icon: const Icon(Icons.bug_report_outlined),
            ),
          ],
          selected: {_env},
          onSelectionChanged: (s) => setState(() => _env = s.first),
        ),
        const SizedBox(height: 24),
        AppFormField(
          label: context.t('auth.devApiUrlProd'),
          controller: _prodUrl,
          keyboardType: TextInputType.url,
        ),
        const SizedBox(height: 16),
        AppFormField(
          label: context.t('auth.devApiUrlDev'),
          controller: _devUrl,
          keyboardType: TextInputType.url,
        ),
        const SizedBox(height: 24),
        FilledButton.icon(
          icon: const Icon(Icons.save),
          label: Text(context.t('common.save')),
          onPressed: _save,
        ),
        const SizedBox(height: 8),
        TextButton(
          onPressed: () => context.go('/login'),
          child: Text(context.t('common.back')),
        ),
      ],
    );
  }
}
