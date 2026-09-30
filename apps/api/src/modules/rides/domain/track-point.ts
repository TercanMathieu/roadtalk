import type { GeoPoint, Meters, MetersPerSecond, TimestampMs } from '@roadtalk/domain-shared';

/**
 * Un relevé du capteur pendant une balade. Volontairement proche de ce que
 * rend le GNSS : on enregistre ce qui est mesuré, on ne recompose rien ici.
 */
export interface TrackPoint {
  readonly position: GeoPoint;
  readonly recordedAt: TimestampMs;

  /**
   * Vitesse Doppler fournie par le GNSS. `undefined` quand le capteur ne la
   * donne pas (premiers instants d'un fix, appareil immobile).
   *
   * Ne JAMAIS la reconstituer en divisant une distance par un temps : le bruit
   * de position se traduit alors en un bruit de vitesse de l'ordre de
   * ±18 km/h (règle physique du projet).
   */
  readonly speedMps: MetersPerSecond | undefined;

  /** Altitude ellipsoïdale. Bien plus bruitée que la position horizontale. */
  readonly altitudeMeters: Meters | undefined;

  /** Rayon d'incertitude horizontale à 68 %. Sert à écarter les mauvais fixes. */
  readonly accuracyMeters: Meters;
}
