import type { SpeedLimitSegmentDto } from '@roadtalk/contracts';

export interface LegSpeedLimitEdge {
  readonly beginShapeIndex: number;
  readonly endShapeIndex: number;
  // undefined : limitation absente d'OpenStreetMap pour ce tronçon.
  readonly speedLimitKph: number | undefined;
}

export interface LegSpeedLimits {
  // Nombre de points du shape décodé de ce leg — sert à décaler les index
  // des legs suivants dans le tracé fusionné.
  readonly pointCount: number;
  readonly edges: readonly LegSpeedLimitEdge[];
}

const KPH_TO_MPS = 1 / 3.6;

// Garde-fou : aucune limitation réelle n'atteint cette valeur, que Valhalla
// utilise comme sentinelle pour "pas de limitation" (autoroute allemande).
const VALHALLA_UNLIMITED_SPEED_KPH = 255;

/**
 * Convertit les tronçons de chaque leg en segments indexés sur le tracé
 * fusionné. Les index Valhalla sont relatifs au shape de leur leg ; la
 * fusion (mergeLegPaths) retire le premier point de chaque leg après le
 * premier, d'où un décalage de (pointCount - 1) par leg précédent.
 *
 * Les tronçons consécutifs de même limitation sont regroupés : un trajet
 * compte des centaines de tronçons mais peu de changements de limitation.
 */
export function buildSpeedLimitSegments(legs: readonly LegSpeedLimits[]): SpeedLimitSegmentDto[] {
  const segments: SpeedLimitSegmentDto[] = [];
  let offset = 0;

  for (const leg of legs) {
    for (const edge of leg.edges) {
      if (edge.speedLimitKph === undefined || edge.speedLimitKph >= VALHALLA_UNLIMITED_SPEED_KPH) {
        continue;
      }

      const startIndex = offset + edge.beginShapeIndex;
      const endIndex = offset + edge.endShapeIndex;
      const speedLimitMps = edge.speedLimitKph * KPH_TO_MPS;
      const previous = segments[segments.length - 1];

      if (previous?.endIndex === startIndex && previous.speedLimitMps === speedLimitMps) {
        segments[segments.length - 1] = { ...previous, endIndex };
      } else {
        segments.push({ startIndex, endIndex, speedLimitMps });
      }
    }

    offset += Math.max(0, leg.pointCount - 1);
  }

  return segments;
}
