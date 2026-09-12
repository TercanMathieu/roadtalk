import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

// Un émulateur Android ne voit pas le réseau local de l'hôte comme un vrai
// téléphone : il passe par son propre NAT. `adb reverse` ouvre un tunnel pour
// que localhost:3000 dans l'émulateur atteigne l'API qui tourne sur le Mac —
// exactement le même mécanisme qu'Expo applique déjà au port 8081 de Metro.
//
// Doit rester silencieux et sans échec quand il n'y a rien à faire (pas d'adb
// installé, aucun émulateur lancé) : il est enchaîné devant `expo start`, et
// ne doit jamais empêcher le bundler de démarrer.

// Même port que API_PORT dans src/lib/apiUrl.ts.
const API_PORT = 3000;

function resolveAdb() {
  const sdkRoot = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
  const candidates = [
    sdkRoot === undefined ? undefined : path.join(sdkRoot, 'platform-tools', 'adb'),
    '/usr/local/share/android-commandlinetools/platform-tools/adb',
    path.join(process.env.HOME ?? '', 'Library/Android/sdk/platform-tools/adb'),
  ].filter((candidate) => candidate !== undefined && candidate !== '');

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  // Dernier recours : adb dans le PATH.
  const probe = spawnSync('adb', ['version'], { stdio: 'ignore' });
  return probe.status === 0 ? 'adb' : undefined;
}

function listDeviceSerials(adb) {
  const result = spawnSync(adb, ['devices'], { encoding: 'utf8' });
  if (result.status !== 0 || typeof result.stdout !== 'string') {
    return [];
  }

  return result.stdout
    .split('\n')
    .slice(1) // la première ligne est l'en-tête "List of devices attached"
    .map((line) => line.trim().split(/\s+/))
    .filter((parts) => parts.length >= 2 && parts[1] === 'device')
    .map((parts) => parts[0]);
}

const adb = resolveAdb();
if (adb === undefined) {
  process.exit(0);
}

const serials = listDeviceSerials(adb);
if (serials.length === 0) {
  process.exit(0);
}

for (const serial of serials) {
  const port = `tcp:${String(API_PORT)}`;
  const result = spawnSync(adb, ['-s', serial, 'reverse', port, port], { stdio: 'ignore' });
  if (result.status === 0) {
    console.log(`[link-emulator-api] port ${String(API_PORT)} relié sur ${serial}`);
  } else {
    console.warn(`[link-emulator-api] échec du lien sur ${serial} — l'API sera peut-être injoignable`);
  }
}

process.exit(0);
