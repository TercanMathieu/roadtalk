import { degrees, meters, metersPerSecond, timestampMs } from '@roadtalk/domain-shared';
import { describe, expect, it } from 'vitest';

import {
  decodeJournal,
  encodeHeader,
  encodePoints,
} from '../../../src/features/ride-summary/ride-journal-format';
import type { TrackPoint } from '../../../src/features/ride-summary/track-point';

const header = { rideId: '3fa85f64-5717-4562-b3fc-2c963f66afa6', startedAt: 1_700_000_000_000 };

function point(index: number, withOptionals = true): TrackPoint {
  return {
    position: { latitude: degrees(48.85 + index * 0.001), longitude: degrees(2.35) },
    recordedAt: timestampMs(1_700_000_000_000 + index * 1000),
    speedMps: withOptionals ? metersPerSecond(12.5) : undefined,
    altitudeMeters: withOptionals ? meters(35.2) : undefined,
    accuracyMeters: meters(4),
  };
}

describe('journal de balade', () => {
  it("relit exactement ce qui a été écrit, en-tête et points", () => {
    const text = encodeHeader(header) + encodePoints([point(0), point(1)]);

    const recovered = decodeJournal(text);

    expect(recovered?.header).toEqual(header);
    expect(recovered?.points).toEqual([point(0), point(1)]);
  });

  it('garde les points sans vitesse ni altitude, sans inventer de valeur', () => {
    const recovered = decodeJournal(encodeHeader(header) + encodePoints([point(0, false)]));

    expect(recovered?.points[0]?.speedMps).toBeUndefined();
    expect(recovered?.points[0]?.altitudeMeters).toBeUndefined();
  });

  it("lit les points écrits par paquets successifs (ajouts à la suite)", () => {
    const text = encodeHeader(header) + encodePoints([point(0), point(1)]) + encodePoints([point(2)]);

    expect(decodeJournal(text)?.points).toHaveLength(3);
  });

  it('ignore une dernière ligne coupée par un arrêt brutal et garde le reste', () => {
    const complete = encodeHeader(header) + encodePoints([point(0), point(1)]);
    const truncated = encodePoints([point(2)]).slice(0, 40);

    const recovered = decodeJournal(complete + truncated);

    expect(recovered?.points).toEqual([point(0), point(1)]);
  });

  it('ignore une ligne qui n\'est pas un point valide', () => {
    const text = `${encodeHeader(header)}{"latitude":999}\n${encodePoints([point(0)])}`;

    expect(decodeJournal(text)?.points).toEqual([point(0)]);
  });

  it("renvoie undefined si l'en-tête est inutilisable", () => {
    expect(decodeJournal('')).toBeUndefined();
    expect(decodeJournal('pas du json\n')).toBeUndefined();
    expect(decodeJournal('{"v":2,"rideId":"x","startedAt":1}\n')).toBeUndefined();
    expect(decodeJournal(encodePoints([point(0)]))).toBeUndefined();
  });

  it('un journal avec seulement un en-tête donne une balade sans point', () => {
    expect(decodeJournal(encodeHeader(header))?.points).toEqual([]);
  });
});
