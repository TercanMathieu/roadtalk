import type { AddressSuggestionDto } from '@roadtalk/contracts';
import { useEffect, useMemo, useState } from 'react';

import { withFreshAccessToken } from '../auth/auth.store';
import { formatClockTime } from '../ride-summary/format';
import type { TrackPoint } from '../ride-summary/track-point';
import { formatDuration } from '../routing/format';
import { reverseGeocode } from '../search/api';
import type { BaladeItem } from './baladeItem';
import { detectRideStops } from './ride-stops';

export type RecapStepKind = 'start' | 'stop' | 'end';

export interface RecapStep {
  readonly kind: RecapStepKind;
  // Ce que la ligne dit du point : "Départ · 14:02", "Arrêt de 12 min · 15:10"…
  readonly caption: string;
  readonly latitude: number;
  readonly longitude: number;
}

export interface ResolvedRecapStep extends RecapStep {
  // undefined tant que l'adresse n'est pas encore résolue.
  readonly address: AddressSuggestionDto | undefined;
  // true si la recherche d'adresse a échoué : la ligne affiche alors les
  // coordonnées plutôt que de rester indéfiniment "en recherche".
  readonly hasFailed: boolean;
}

// Une balade très hachée pourrait produire des dizaines d'arrêts, donc
// autant de requêtes de géocodage : seuls les plus longs sont gardés.
const MAX_RIDE_STOPS = 6;

// Adresses déjà résolues pendant cette session, par coordonnées : rouvrir la
// même balade ne redemande rien au géocodeur. En mémoire seulement — jamais
// écrit sur disque ni journalisé (C4, données de localisation).
const addressCache = new Map<string, AddressSuggestionDto>();

function cacheKey(step: RecapStep): string {
  return `${step.latitude.toFixed(5)},${step.longitude.toFixed(5)}`;
}

function buildRideSteps(points: readonly TrackPoint[]): readonly RecapStep[] {
  const first = points[0];
  const last = points[points.length - 1];
  if (first === undefined || last === undefined) {
    return [];
  }

  const longestStops = [...detectRideStops(points)]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, MAX_RIDE_STOPS)
    .sort((a, b) => a.startedAt - b.startedAt);

  return [
    {
      kind: 'start',
      caption: `Départ · ${formatClockTime(first.recordedAt)}`,
      latitude: first.position.latitude,
      longitude: first.position.longitude,
    },
    ...longestStops.map(
      (stop): RecapStep => ({
        kind: 'stop',
        caption: `Arrêt de ${formatDuration(stop.duration)} · ${formatClockTime(stop.startedAt)}`,
        latitude: stop.position.latitude,
        longitude: stop.position.longitude,
      }),
    ),
    {
      kind: 'end',
      caption: `Arrivée · ${formatClockTime(last.recordedAt)}`,
      latitude: last.position.latitude,
      longitude: last.position.longitude,
    },
  ];
}

function buildRouteSteps(item: Extract<BaladeItem, { kind: 'route' }>): readonly RecapStep[] {
  const { waypoints } = item.route;
  return waypoints.map((waypoint, index): RecapStep => {
    const isFirst = index === 0;
    const isLast = index === waypoints.length - 1;
    return {
      kind: isFirst ? 'start' : isLast ? 'end' : 'stop',
      caption: isFirst ? 'Départ' : isLast ? 'Arrivée' : `Étape ${String(index)}`,
      latitude: waypoint.latitude,
      longitude: waypoint.longitude,
    };
  });
}

// Récapitulatif du parcours d'une balade (départ, arrêts retrouvés dans le
// tracé, arrivée) ou d'un itinéraire enregistré (ses points de passage), avec
// l'adresse de chaque point. Les adresses ne sont stockées nulle part : elles
// sont demandées au géocodeur à l'ouverture du détail, une requête par point,
// et la liste s'affiche tout de suite, chaque ligne se complétant à son tour.
export function useItineraryRecap(
  item: BaladeItem,
  // Tracé de la balade — undefined tant qu'il n'est pas chargé, ou pour un
  // itinéraire (qui n'a pas de tracé GPS).
  points: readonly TrackPoint[] | undefined,
): readonly ResolvedRecapStep[] {
  const steps = useMemo(
    () => (item.kind === 'route' ? buildRouteSteps(item) : points !== undefined ? buildRideSteps(points) : []),
    [item, points],
  );
  // Compteur seulement : la source de vérité est `addressCache` / `failedKeys`,
  // ce state ne sert qu'à redemander un rendu quand une adresse arrive.
  const [, setResolvedCount] = useState(0);
  const [failedKeys, setFailedKeys] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    for (const step of steps) {
      const key = cacheKey(step);
      if (addressCache.has(key)) {
        continue;
      }

      withFreshAccessToken((accessToken) =>
        reverseGeocode(accessToken, { latitude: step.latitude, longitude: step.longitude }),
      )
        .then((address) => {
          addressCache.set(key, address);
          if (!cancelled) {
            setResolvedCount((count) => count + 1);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setFailedKeys((previous) => new Set(previous).add(key));
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [steps]);

  return steps.map((step) => {
    const key = cacheKey(step);
    return { ...step, address: addressCache.get(key), hasFailed: failedKeys.has(key) };
  });
}
