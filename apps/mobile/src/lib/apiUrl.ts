import Constants from 'expo-constants';

// Même valeur que PORT dans apps/api/.env.
const API_PORT = 3000;

// Surcharge explicite : indispensable en production (il n'y a plus de Metro),
// et pratique pour viser un backend distant depuis un poste de dev.
const EXPLICIT_API_URL = String(process.env['EXPO_PUBLIC_API_URL'] ?? '');

// À défaut, on déduit l'adresse de l'API de celle du bundler Metro : l'appareil
// y est déjà connecté, donc l'hôte qu'il a utilisé pour l'atteindre mène
// forcément à la machine de dev — quelle que soit l'IP du jour (bail DHCP,
// changement de réseau), sans rien à éditer à la main. `hostUri` n'est
// renseigné qu'en développement, ce qui rend le repli ci-dessous naturel.
function deriveFromMetroHost(): string | undefined {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri === undefined) {
    return undefined;
  }

  const host = hostUri.split(':')[0];
  if (host === undefined || host.length === 0) {
    return undefined;
  }

  return `http://${host}:${String(API_PORT)}`;
}

export const API_BASE_URL: string | undefined =
  EXPLICIT_API_URL.length > 0 ? EXPLICIT_API_URL : deriveFromMetroHost();
