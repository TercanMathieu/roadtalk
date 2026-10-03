import { Directory, File, Paths } from 'expo-file-system';

import { decodeJournal, encodeHeader, encodePoints, type RecoveredRide, type RideJournalHeader } from './ride-journal-format';
import type { TrackPoint } from './track-point';

// Une seule balade en cours à la fois : un seul fichier. Dans le stockage
// propre à l'app (pas de cache que l'OS peut vider) ; jamais sauvegardé dans
// le cloud ni exporté — ce sont des données de localisation (C4).
const JOURNAL_DIRECTORY = 'ride-journal';
const JOURNAL_FILE = 'active-ride.jsonl';

const encoder = new TextEncoder();

function journalFile(): File {
  return new File(new Directory(Paths.document, JOURNAL_DIRECTORY), JOURNAL_FILE);
}

// Crée un journal vide pour une nouvelle balade, en écrasant un éventuel
// journal resté d'une balade précédente non récupérée : démarrer un nouveau
// guidage est un choix explicite de repartir de zéro.
export function startJournal(header: RideJournalHeader): void {
  const directory = new Directory(Paths.document, JOURNAL_DIRECTORY);
  directory.create({ intermediates: true, idempotent: true });
  const file = journalFile();
  file.create({ overwrite: true });
  file.write(encodeHeader(header));
}

// Ajoute des points à la fin du journal. Ne lève jamais : un disque plein ou
// une erreur d'écriture ne doit pas interrompre le guidage — la balade
// continue en mémoire, seule sa récupération après un arrêt brutal est
// compromise.
export function appendToJournal(points: readonly TrackPoint[]): void {
  if (points.length === 0) {
    return;
  }

  try {
    const handle = journalFile().open();
    try {
      handle.offset = handle.size;
      handle.writeBytes(encoder.encode(encodePoints(points)));
    } finally {
      handle.close();
    }
  } catch {
    // Voir le commentaire de la fonction.
  }
}

// Balade interrompue retrouvée sur le disque, ou undefined s'il n'y en a pas
// (ou si le fichier est inutilisable).
export function readJournal(): RecoveredRide | undefined {
  try {
    const file = journalFile();
    return file.exists ? decodeJournal(file.textSync()) : undefined;
  } catch {
    return undefined;
  }
}

export function discardJournal(): void {
  try {
    const file = journalFile();
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Un journal qu'on n'arrive pas à supprimer sera proposé de nouveau au
    // prochain démarrage : désagréable, pas dangereux.
  }
}
