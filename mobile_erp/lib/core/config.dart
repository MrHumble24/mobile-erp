/// Build-time configuration.
///
/// Override the API base with `--dart-define=API_URL=https://…`.
/// Server has **no global prefix** and lives on :3000 by default.
class AppConfig {
  AppConfig._();

  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://localhost:3000',
  );
}
