import 'package:dio/dio.dart';

/// Normalized API failure. Maps the server error envelope
/// `{ statusCode, message: string|string[], error }` into one shape so the UI
/// never has to parse a [DioException] directly.
class AppException implements Exception {
  const AppException(this.statusCode, this.message, {this.error});

  /// HTTP status (0 when the request never reached the server).
  final int statusCode;

  /// Human-facing message. A `string[]` envelope is joined with ", ".
  final String message;

  /// The envelope's short `error` label (e.g. "Bad Request"), when present.
  final String? error;

  bool get isNetwork => statusCode == 0;

  factory AppException.fromDio(DioException e) {
    final res = e.response;
    final data = res?.data;
    if (data is Map) {
      final raw = data['message'];
      final message = raw is List
          ? raw.join(', ')
          : (raw?.toString() ?? _fallback(e));
      return AppException(
        res?.statusCode ?? 0,
        message,
        error: data['error']?.toString(),
      );
    }
    return AppException(res?.statusCode ?? 0, _fallback(e));
  }

  static String _fallback(DioException e) {
    if (e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.connectionTimeout) {
      return 'No connection to the server.';
    }
    return e.message ?? 'Request failed';
  }

  @override
  String toString() => 'AppException($statusCode): $message';
}

/// Run a dio call and surface a normalized [AppException] on failure.
/// The dio interceptor already attaches one; this unwraps it for callers so
/// every repository catches the same type.
Future<T> runApi<T>(Future<T> Function() request) async {
  try {
    return await request();
  } on DioException catch (e) {
    final mapped = e.error;
    throw mapped is AppException ? mapped : AppException.fromDio(e);
  }
}
