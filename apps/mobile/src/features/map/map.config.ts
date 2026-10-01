// Style de départ (dark theme MapTiler standard) — à remplacer par un style
// vraiment custom (section 8 du brief : routes très contrastées, POI réduits
// au minimum) une fois qu'on peut voir le rendu réel sur un device.
const MAPTILER_STYLE_ID = 'streets-v2-dark';
const MAPTILER_API_KEY = String(process.env['EXPO_PUBLIC_MAPTILER_API_KEY'] ?? '');

export const MAP_STYLE_URL = `https://api.maptiler.com/maps/${MAPTILER_STYLE_ID}/style.json?key=${MAPTILER_API_KEY}`;

// [longitude, latitude] — convention GeoJSON/MapLibre, pas [latitude, longitude].
// Paris : centre de repli, affiché seulement le temps d'obtenir un premier fix GPS.
export const DEFAULT_CENTER_COORDINATES: [number, number] = [2.3522, 48.8566];

// Échelle de zoom MapLibre : 11 ≈ agglomération, 13 ≈ quartier,
// 15 ≈ rues nommées lisibles, 16 ≈ pâté de maisons, 18 ≈ carrefour.
// 17 : niveau de navigation classique — bâtiments individuels visibles, la rue
// sur laquelle on se trouve est sans ambiguïté. L'écran de guidage
// turn-by-turn reprendra ce niveau en y ajoutant le suivi du cap et
// l'inclinaison — c'est un mode distinct (DA section 8).
export const DEFAULT_ZOOM_LEVEL = 17;

// Inclinaison de la caméra, en degrés (0 = vue zénithale, 60 = maximum MapLibre).
// 45° donne la perspective attendue d'un GPS : on voit ce qui arrive devant
// plutôt que ce qu'on survole. Coût à connaître — une caméra inclinée fait
// entrer bien plus de tuiles dans le champ (tout ce qui va jusqu'à l'horizon),
// donc plus de rendu et plus de données (C1, et un corridor hors-ligne plus
// large à pré-cacher, C3).
export const DEFAULT_PITCH_DEGREES = 45;

// Mode guidage (DA cockpit, écran "Guidage Actif") : inclinaison maximale
// MapLibre et zoom resserré pour une vue "corridor" immersive — approximation
// volontaire d'un rendu 3D dédié (hors de portée raisonnable, voir la
// manœuvre Figma correspondante), construite avec de vraies données de carte
// plutôt qu'une illustration statique.
export const GUIDANCE_PITCH_DEGREES = 60;
export const GUIDANCE_ZOOM_LEVEL = 18;
