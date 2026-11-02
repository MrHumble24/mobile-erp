import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_erp/core/dev_config.dart';

void main() {
  const cfg = DevConfig(
    env: AppEnv.production,
    prodUrl: 'https://api.prod',
    devUrl: 'http://localhost:3000',
  );

  test('baseUrl follows the active environment', () {
    expect(cfg.baseUrl, 'https://api.prod');
    expect(
      const DevConfig(
        env: AppEnv.development,
        prodUrl: 'https://api.prod',
        devUrl: 'http://localhost:3000',
      ).baseUrl,
      'http://localhost:3000',
    );
  });

  test('defaults start on production', () {
    expect(DevConfig.defaults().env, AppEnv.production);
  });
}
