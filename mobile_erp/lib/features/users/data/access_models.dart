/// Domain models for the Users & Access (RBAC) feature. Mirrors the server
/// `UserView` / `access` projections. None of these carry cost fields.
class UserProfileData {
  const UserProfileData({
    required this.firstName,
    this.lastName,
    this.phone,
    this.telegramHandle,
  });

  final String firstName;
  final String? lastName;
  final String? phone;
  final String? telegramHandle;

  String get fullName =>
      [firstName, if (lastName != null && lastName!.isNotEmpty) lastName].join(' ');

  factory UserProfileData.fromJson(Map<String, dynamic> json) => UserProfileData(
        firstName: (json['firstName'] ?? '') as String,
        lastName: json['lastName'] as String?,
        phone: json['phone'] as String?,
        telegramHandle: json['telegramHandle'] as String?,
      );
}

class UserView {
  const UserView({
    required this.id,
    required this.email,
    required this.isActive,
    required this.roles,
    this.profile,
    this.lastLoginAt,
  });

  final String id;
  final String email;
  final bool isActive;
  final List<String> roles;
  final UserProfileData? profile;
  final DateTime? lastLoginAt;

  factory UserView.fromJson(Map<String, dynamic> json) => UserView(
        id: json['id'] as String,
        email: json['email'] as String,
        isActive: (json['isActive'] ?? true) as bool,
        roles: (json['roles'] as List? ?? const []).map((e) => '$e').toList(),
        profile: json['profile'] == null
            ? null
            : UserProfileData.fromJson((json['profile'] as Map).cast()),
        lastLoginAt: json['lastLoginAt'] == null
            ? null
            : DateTime.tryParse('${json['lastLoginAt']}'),
      );
}

class RoleView {
  const RoleView({
    required this.code,
    required this.name,
    required this.isSystem,
    required this.permissionCodes,
    this.description,
  });

  final String code;
  final String name;
  final bool isSystem;
  final List<String> permissionCodes;
  final String? description;

  factory RoleView.fromJson(Map<String, dynamic> json) => RoleView(
        code: json['code'] as String,
        name: json['name'] as String,
        isSystem: (json['isSystem'] ?? false) as bool,
        permissionCodes:
            (json['permissionCodes'] as List? ?? const []).map((e) => '$e').toList(),
        description: json['description'] as String?,
      );
}

class PermissionView {
  const PermissionView({
    required this.code,
    required this.resource,
    required this.action,
    this.description,
  });

  final String code;
  final String resource;
  final String action;
  final String? description;

  factory PermissionView.fromJson(Map<String, dynamic> json) => PermissionView(
        code: json['code'] as String,
        resource: json['resource'] as String,
        action: json['action'] as String,
        description: json['description'] as String?,
      );
}

/// One per-user permission override sent to `PUT /users/:id/permissions`.
class PermissionOverride {
  const PermissionOverride({required this.permissionCode, required this.granted});

  final String permissionCode;
  final bool granted;

  Map<String, dynamic> toJson() =>
      {'permissionCode': permissionCode, 'granted': granted};
}
