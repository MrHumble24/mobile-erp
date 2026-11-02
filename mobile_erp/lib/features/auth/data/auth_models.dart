/// Authenticated user as returned by `/auth/login` and `/auth/me`.
/// `profile` may be null; permission codes (not role names) drive all gating.
class AuthUser {
  const AuthUser({
    required this.id,
    required this.email,
    required this.roles,
    required this.permissions,
    this.profile,
  });

  final String id;
  final String email;
  final AuthProfile? profile;
  final List<String> roles;
  final List<String> permissions;

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        id: json['id'] as String,
        email: json['email'] as String,
        profile: json['profile'] == null
            ? null
            : AuthProfile.fromJson((json['profile'] as Map).cast()),
        roles: (json['roles'] as List? ?? const []).map((e) => '$e').toList(),
        permissions:
            (json['permissions'] as List? ?? const []).map((e) => '$e').toList(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'profile': profile?.toJson(),
        'roles': roles,
        'permissions': permissions,
      };
}

class AuthProfile {
  const AuthProfile({required this.fullName, this.phone});

  final String fullName;
  final String? phone;

  factory AuthProfile.fromJson(Map<String, dynamic> json) => AuthProfile(
        fullName: (json['fullName'] ?? '') as String,
        phone: json['phone'] as String?,
      );

  Map<String, dynamic> toJson() => {'fullName': fullName, 'phone': phone};
}

/// `/auth/login` response: a bare access token (no refresh) + the user.
class LoginResult {
  const LoginResult({required this.token, required this.user});
  final String token;
  final AuthUser user;
}
