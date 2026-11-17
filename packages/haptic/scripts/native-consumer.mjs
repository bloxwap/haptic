import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { nativeVersions } from './native-versions.mjs';

/** Install actual native peers and exercise the published types and Metro resolver, without stubs. */
export function checkNativeConsumers(archive, temporary) {
  // Metro hashes canonical paths; macOS aliases /var to /private/var.
  temporary = realpathSync(temporary);
  archive = realpathSync(archive);
  function run(args, cwd) {
    const result = spawnSync(process.execPath, args, { cwd, encoding: 'utf8', env: { ...process.env, EXPO_NO_TELEMETRY: '1', CI: '1' }, maxBuffer: 10 * 1024 * 1024, timeout: 240000 });
    if (result.status !== 0) throw new Error(`Native consumer failed: ${args.join(' ')}\n${result.stdout}\n${result.stderr}\n${result.error ?? ''}`);
    return result.stdout;
  }
  for (const version of nativeVersions) {
    const consumer = join(temporary, `native-expo-${version.expo}`);
    mkdirSync(consumer, { recursive: true });
    writeFileSync(join(consumer, 'package.json'), JSON.stringify({ private: true, name: 'haptic-native-consumer', version: '1.0.0', dependencies: {
      '@bloxwap/haptic': `file:${archive}`, expo: version.expo, 'expo-asset': version.asset, 'expo-haptics': version.haptics, react: version.react, 'react-native': version.reactNative,
      '@types/react': version.react.startsWith('18') ? '^18' : '^19', typescript: '5.9.3',
    } }));
    const install = spawnSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock'], { cwd: consumer, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, timeout: 240000 });
    if (install.status !== 0) throw new Error(`Native Expo ${version.expo} install failed\n${install.stdout}\n${install.stderr}\n${install.error ?? ''}`);
    writeFileSync(join(consumer, 'consumer.ts'), `
      import { haptics, setHapticsEnabled, createExpoHapticBackend, installHapticBackend, type HapticsApi } from '@bloxwap/haptic';
      import { haptics as explicit, createExpoHapticBackend as explicitBackend } from '@bloxwap/haptic/native';
      import * as ExpoHaptics from 'expo-haptics';
      const api: HapticsApi = haptics;
      export function exercise() { setHapticsEnabled(true); const restore = installHapticBackend(createExpoHapticBackend(ExpoHaptics)); api.selection(); explicit.success(); restore(); }
      export const backend = explicitBackend(ExpoHaptics);
    `);
    writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true, skipLibCheck: true, noEmit: true, target: 'ES2020', module: 'ESNext', moduleResolution: 'Bundler', customConditions: ['react-native'], types: ['react'] }, files: ['consumer.ts'] }));
    run(['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'], consumer);
    // Resolve Expo's own preset; npm may nest it under expo rather than hoisting it.
    writeFileSync(join(consumer, 'babel.config.cjs'), "module.exports = { presets: [require.resolve('babel-preset-expo', { paths: [require.resolve('expo/package.json')] })] };\n");
    writeFileSync(join(consumer, 'metro-check.cjs'), `
      const assert = require('node:assert/strict');
      const { getDefaultConfig } = require('expo/metro-config');
      const Metro = require('metro');
      (async () => {
        for (const platform of ['ios', 'android']) {
          // loadConfig adds projectRoot to the file map's watch roots.
          const config = await Metro.loadConfig({ cwd: __dirname }, getDefaultConfig(__dirname));
          config.maxWorkers = 2;
          config.resolver.useWatchman = false;
          config.resolver.unstable_enablePackageExports = true;
          config.resolver.unstable_conditionNames = ['require', 'react-native'];
          const resolved = new Map();
          const original = config.resolver.resolveRequest;
          config.resolver.resolveRequest = (context, name, target) => {
            const result = original ? original(context, name, target) : context.resolveRequest(context, name, target);
            if (name === '@bloxwap/haptic' || name === '@bloxwap/haptic/native') resolved.set(name, result.filePath);
            return result;
          };
          await Metro.runBuild(config, { entry: 'consumer.ts', platform, dev: false, minify: false, out: platform + '.js' });
          assert.equal(resolved.size, 2);
          assert.equal(resolved.get('@bloxwap/haptic'), resolved.get('@bloxwap/haptic/native'));
          for (const path of resolved.values()) assert.match(path, /[/\\\\]dist[/\\\\]native\\.js$/);
          console.log(platform + ': real Expo/RN dependencies and both native entry points bundled successfully');
        }
      })().catch(error => { console.error(error); process.exit(1); });
    `);
    console.log(run(['metro-check.cjs'], consumer).trim());
    console.log(`Expo ${version.expo}, expo-haptics ${version.haptics}, RN ${version.reactNative}, React ${version.react}: native consumer passed.`);
  }
}
