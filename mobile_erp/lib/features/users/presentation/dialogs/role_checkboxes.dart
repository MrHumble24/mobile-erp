import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/i18n.dart';
import '../../application/users_controllers.dart';

/// A bordered, scrollable column of role checkboxes. Shared by the create-user
/// and edit-user dialogs. [selected] holds the chosen role codes.
class RoleCheckboxes extends ConsumerWidget {
  const RoleCheckboxes({required this.selected, required this.onToggle, super.key});

  final Set<String> selected;
  final void Function(String code) onToggle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roles = ref.watch(rolesControllerProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(context.t('users.roles'),
            style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 6),
        roles.when(
          loading: () => const LinearProgressIndicator(),
          error: (e, _) => Text('$e',
              style: Theme.of(context).textTheme.bodySmall),
          data: (list) => Container(
            constraints: const BoxConstraints(maxHeight: 160),
            decoration: BoxDecoration(
              border: Border.all(color: Theme.of(context).dividerColor),
              borderRadius: BorderRadius.circular(12),
            ),
            child: ListView(
              shrinkWrap: true,
              children: [
                for (final r in list)
                  CheckboxListTile(
                    dense: true,
                    controlAffinity: ListTileControlAffinity.leading,
                    value: selected.contains(r.code),
                    onChanged: (_) => onToggle(r.code),
                    title: Text(r.name),
                    subtitle: Text(r.code,
                        style: Theme.of(context).textTheme.bodySmall),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
