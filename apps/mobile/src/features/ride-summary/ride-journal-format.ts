import { type TrackPointDto, trackPointSchema } from '@roadtalk/contracts';

import { toTrackPoints } from '../history/trackPoint';
import type { TrackPoint } from './track-point';

// Journal d'une balade en cours d'enregistrement : un fichier texte, une
// ligne JSON par enregistrement. La première ligne est l'en-tête, les
// suivantes sont des points GPS. Ce format ne contient que ce qui permet de
// retrouver la balade après un arrêt brutal de l'app.
//
// Une ligne par point, ajoutée au fur et à mesure, plutôt qu'un seul tableau
// JSON réécrit : une écriture interrompue (app tuée en plein milieu) ne peut
// abîmer que la dernière ligne, que la lecture ignore, jamais tout le tracé.

export interface RideJournalHeader {
  // Identifiant de la balade, choisi au démarrage et envoyé tel quel au
  // serveur : un envoi rejoué (réponse perdue, C3) ne crée pas de doublon.
  readonly rideId: string;
  readonly startedAt: number;
}

export interface RecoveredRide {
  readonly header: RideJournalHeader;
  readonly points: readonly TrackPoint[];
}

export function encodeHeader(header: RideJournalHeader): string {
  return `${JSON.stringify({ v: 1, rideId: header.rideId, startedAt: header.startedAt })}\n`;
}

// Chaque ligne se termine par \n : une ligne coupée n'en a pas, ce qui la
// distingue d'une ligne complète sans avoir à deviner.
export function encodePoints(points: readonly TrackPoint[]): string {
  return points
    .map((point) => {
      const dto: TrackPointDto = {
        latitude: point.position.latitude,
        longitude: point.position.longitude,
        recordedAt: point.recordedAt,
        accuracyMeters: point.accuracyMeters,
        ...(point.speedMps !== undefined ? { speedMps: point.speedMps } : {}),
        ...(point.altitudeMeters !== undefined ? { altitudeMeters: point.altitudeMeters } : {}),
      };
      return `${JSON.stringify(dto)}\n`;
    })
    .join('');
}

function parseHeader(line: string): RideJournalHeader | undefined {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    return undefined;
  }
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  const rideId = record['rideId'];
  const startedAt = record['startedAt'];
  if (record['v'] !== 1 || typeof rideId !== 'string' || typeof startedAt !== 'number') {
    return undefined;
  }
  return { rideId, startedAt };
}

// Relit un journal. Tolérant : une ligne illisible est ignorée (la dernière
// peut être tronquée par un arrêt brutal), le reste est gardé. undefined
// seulement si l'en-tête lui-même est inutilisable — sans l'identifiant de la
// balade, rien ne peut être récupéré proprement.
export function decodeJournal(text: string): RecoveredRide | undefined {
  const lines = text.split('\n');
  const header = parseHeader(lines[0] ?? '');
  if (header === undefined) {
    return undefined;
  }

  const dtos: TrackPointDto[] = [];
  for (const line of lines.slice(1)) {
    if (line.length === 0) {
      continue;
    }
    let value: unknown;
    try {
      value = JSON.parse(line);
    } catch {
      continue;
    }
    const parsed = trackPointSchema.safeParse(value);
    if (parsed.success) {
      dtos.push(parsed.data);
    }
  }

  return { header, points: toTrackPoints(dtos) };
}
