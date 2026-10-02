import { degrees, type GeoPoint } from '@roadtalk/domain-shared';
import { useEffect, useState } from 'react';

import { withFreshAccessToken } from '../auth/auth.store';
import type { TrackPoint } from '../ride-summary/track-point';
import { computeRoute } from '../routing/api';
import { getRide } from './api';
import { type BaladeItem, itemId } from './baladeItem';
import { toTrackPoints } from './trackPoint';

export interface BaladeGeometry {
  // Chemin à dessiner sur la carte : tracé GPS réel pour une balade, chemin
  // recalculé par le moteur de routage (routes réelles, jamais une ligne
  // droite) pour un itinéraire pas encore roulé.
  readonly path: readonly GeoPoint[];
  // Tracé complet d'une balade (horodatage, altitude…), nécessaire à l'export
  // GPX et au récapitulatif des arrêts. Absent pour un itinéraire.
  readonly points: readonly TrackPoint[] | undefined;
}

// Une seule requête par balade/itinéraire pour toute la session, partagée
// entre la carte de la liste et le détail : la promesse elle-même est mise en
// cache, donc deux demandes simultanées n'en déclenchent qu'une. En mémoire
// seulement — jamais écrit sur disque ni journalisé (C4).
const geometryCache = new Map<string, Promise<BaladeGeometry>>();

async function loadGeometry(item: BaladeItem): Promise<BaladeGeometry> {
  if (item.kind === 'ride') {
    const detail = await withFreshAccessToken((accessToken) => getRide(accessToken, item.ride.id));
    const points = toTrackPoints(detail.track);
    return { path: points.map((point) => point.position), points };
  }

  const { route } = item;
  const geometry = await withFreshAccessToken((accessToken) =>
    computeRoute(accessToken, route.waypoints, route.routingOptions.avoidHighways),
  );
  return {
    path: geometry.path.map((point) => ({
      latitude: degrees(point.latitude),
      longitude: degrees(point.longitude),
    })),
    points: undefined,
  };
}

// Exporté pour un chargement ponctuel (relancer une balade depuis une ligne
// de la liste, qui n'affiche pas de carte et n'a donc pas déjà son tracé).
export function loadBaladeGeometry(item: BaladeItem): Promise<BaladeGeometry> {
  const id = itemId(item);
  const cached = geometryCache.get(id);
  if (cached !== undefined) {
    return cached;
  }

  const pending = loadGeometry(item);
  geometryCache.set(id, pending);
  // Un échec (réseau) ne doit pas rester en cache : la prochaine ouverture
  // retentera plutôt que de rester sans carte jusqu'au redémarrage.
  pending.catch(() => {
    geometryCache.delete(id);
  });
  return pending;
}

// Tracé d'une balade ou d'un itinéraire, chargé à la demande — la liste ne
// le contient pas (potentiellement des milliers de points par balade).
// undefined tant qu'il n'est pas arrivé, ou si le chargement a échoué : la
// carte est alors simplement absente, le reste reste utilisable.
export function useBaladeGeometry(item: BaladeItem | undefined): BaladeGeometry | undefined {
  const [loaded, setLoaded] = useState<{ id: string; geometry: BaladeGeometry } | undefined>(undefined);
  const id = item !== undefined ? itemId(item) : undefined;

  useEffect(() => {
    if (item === undefined) {
      return;
    }

    let cancelled = false;
    const currentId = itemId(item);
    loadBaladeGeometry(item)
      .then((geometry) => {
        if (!cancelled) {
          setLoaded({ id: currentId, geometry });
        }
      })
      .catch(() => {
        // Voir le commentaire du hook : pas de carte, rien d'autre à faire.
      });

    return () => {
      cancelled = true;
    };
    // `id` suffit : `item` est reconstruit à chaque rendu de la liste, mais
    // désigne la même balade tant que son identifiant ne change pas.
  }, [id]);

  return loaded !== undefined && loaded.id === id ? loaded.geometry : undefined;
}
