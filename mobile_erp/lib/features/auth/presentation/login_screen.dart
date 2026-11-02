import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/app_exception.dart';
import '../../../data/sync/connectivity.dart';
import '../../../l10n/i18n.dart';
import '../../../shared/ui/app_form_field.dart';
import '../application/session_controller.dart';

/// Email + password sign-in. Submits to [SessionController.login]; the router
/// redirect navigates away once the session is set. Errors surface inline.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState?.validate() != true) return;
    ref.read(sessionControllerProvider.notifier).login(
          _email.text.trim(),
          _password.text,
        );
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionControllerProvider);
    final busy = session.isLoading;
    final error = session.hasError ? session.error : null;
    final online = ref.watch(connectivityProvider).valueOrNull ?? true;
    final text = Theme.of(context).textTheme;

    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 380),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(context.t('auth.loginTitle'), style: text.headlineMedium),
                  const SizedBox(height: 4),
                  Text(context.t('auth.loginSubtitle'), style: text.bodyMedium),
                  if (!online) ...[
                    const SizedBox(height: 16),
                    _OfflineBanner(message: context.t('auth.offlineSignIn')),
                  ],
                  const SizedBox(height: 24),
                  AppFormField(
                    label: context.t('auth.emailLabel'),
                    controller: _email,
                    hintText: context.t('auth.emailPlaceholder'),
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    autofillHints: const [AutofillHints.username],
                    enabled: !busy,
                    validator: (v) => (v == null || v.trim().isEmpty)
                        ? context.t('common.required')
                        : null,
                  ),
                  const SizedBox(height: 16),
                  AppFormField(
                    label: context.t('auth.passwordLabel'),
                    controller: _password,
                    hintText: context.t('auth.passwordPlaceholder'),
                    obscureText: true,
                    textInputAction: TextInputAction.done,
                    autofillHints: const [AutofillHints.password],
                    enabled: !busy,
                    onFieldSubmitted: (_) => _submit(),
                    validator: (v) => (v == null || v.isEmpty)
                        ? context.t('common.required')
                        : null,
                  ),
                  if (error != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _message(context, error),
                      style: text.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: busy ? null : _submit,
                    child: Text(
                      busy ? context.t('auth.loggingIn') : context.t('auth.loginButton'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton.icon(
                    icon: const Icon(Icons.developer_mode, size: 18),
                    label: Text(context.t('auth.devPanel')),
                    onPressed: () => context.push('/dev'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _message(BuildContext context, Object error) {
    if (error is AppException) {
      return error.statusCode == 401
          ? context.t('auth.invalidCredentials')
          : error.message;
    }
    return context.t('common.error');
  }
}

class _OfflineBanner extends StatelessWidget {
  const _OfflineBanner({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(9),
      ),
      child: Row(
        children: [
          const Icon(Icons.cloud_off, size: 18),
          const SizedBox(width: 8),
          Expanded(child: Text(message, style: Theme.of(context).textTheme.bodySmall)),
        ],
      ),
    );
  }
}
