import type { GeoPoint } from '@roadtalk/domain-shared';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { TrackPoint } from './track-point';

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Nom de fichier sûr sur les deux OS : pas d'accents, d'espaces ni de
// ponctuation qui pourraient poser problème à un gestionnaire de fichiers.
function slugify(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return slug.length > 0 ? slug : 'balade';
}

function buildGpxXml(trackName: string, points: readonly TrackPoint[]): string {
  const trackPoints = points
    .map((point) => {
      const elevation =
        point.altitudeMeters !== undefined ? `<ele>${point.altitudeMeters.toFixed(1)}</ele>` : '';
      const time = `<time>${new Date(point.recordedAt).toISOString()}</time>`;
      return `<trkpt lat="${String(point.position.latitude)}" lon="${String(point.position.longitude)}">${elevation}${time}</trkpt>`;
    })
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="RoadTalk" xmlns="http://www.topografix.com/GPX/1/1">',
    '<trk>',
    `<name>${escapeXml(trackName)}</name>`,
    `<trkseg>${trackPoints}</trkseg>`,
    '</trk>',
    '</gpx>',
  ].join('');
}

// Itinéraire pas encore roulé : un tracé sans horodatage ni altitude (il n'y
// a pas eu de mesure), au même format <trk> pour rester lisible par les
// mêmes applications qu'une balade exportée.
function buildRouteGpxXml(routeName: string, path: readonly GeoPoint[]): string {
  const trackPoints = path
    .map((point) => `<trkpt lat="${String(point.latitude)}" lon="${String(point.longitude)}"></trkpt>`)
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="RoadTalk" xmlns="http://www.topografix.com/GPX/1/1">',
    '<trk>',
    `<name>${escapeXml(routeName)}</name>`,
    `<trkseg>${trackPoints}</trkseg>`,
    '</trk>',
    '</gpx>',
  ].join('');
}

async function shareGpx(name: string, xml: string): Promise<void> {
  const file = new File(Paths.cache, `${slugify(name)}.gpx`);
  file.create({ overwrite: true });
  file.write(xml);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Le partage de fichiers n'est pas disponible sur cet appareil.");
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/gpx+xml',
    dialogTitle: 'Exporter la trace GPX',
  });
}

// Génère un GPX réel à partir du tracé réellement enregistré (voir
// useTrackRecording) et ouvre la feuille de partage native — aucun serveur
// impliqué, fonctionne hors réseau (C3).
export async function exportTrackAsGpx(trackName: string, points: readonly TrackPoint[]): Promise<void> {
  await shareGpx(trackName, buildGpxXml(trackName, points));
}

// Même partage pour un itinéraire enregistré, à partir du chemin calculé par
// le moteur de routage (voir useBaladeGeometry).
export async function exportRouteAsGpx(routeName: string, path: readonly GeoPoint[]): Promise<void> {
  await shareGpx(routeName, buildRouteGpxXml(routeName, path));
}
