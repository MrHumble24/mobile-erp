import 'dart:convert';

/// True when [token] is a JWT whose `exp` claim is already in the past, or is
/// malformed enough that it can't be trusted. Used by the session restore so an
/// expired 12h token isn't treated as a live offline session. A token with no
/// `exp` claim is treated as non-expiring (the server always sets one).
bool isJwtExpired(String token, {DateTime? now}) {
  final parts = token.split('.');
  if (parts.length != 3) return true;
  try {
    final payload = jsonDecode(
      utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))),
    ) as Map<String, dynamic>;
    final exp = payload['exp'];
    if (exp is! int) return false; // no expiry claim → treat as non-expiring
    final expiry = DateTime.fromMillisecondsSinceEpoch(exp * 1000, isUtc: true);
    return (now ?? DateTime.now().toUtc()).isAfter(expiry);
  } catch (_) {
    return true;
  }
}
