// Style de départ (dark theme MapTiler standard) — à remplacer par un style
// vraiment custom (section 8 du brief : routes très contrastées, POI réduits
// au minimum) une fois qu'on peut voir le rendu réel sur un device.
const MAPTILER_STYLE_ID = 'streets-v2-dark';
const MAPTILER_API_KEY = String(process.env['EXPO_PUBLIC_MAPTILER_API_KEY'] ?? '');

export const MAP_STYLE_URL = `https://api.maptiler.com/maps/${MAPTILER_STYLE_ID}/style.json?key=${MAPTILER_API_KEY}`;

// [longitude, latitude] — convention GeoJSON/MapLibre, pas [latitude, longitude].
// Paris : centre par défaut tant qu'il n'y a pas de position réelle (session suivante).
export const DEFAULT_CENTER_COORDINATES: [number, number] = [2.3522, 48.8566];
export const DEFAULT_ZOOM_LEVEL = 11;
