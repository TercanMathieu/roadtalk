import type { StyleSpecification } from '@maplibre/maplibre-react-native';

import { MAP_STYLE_URL } from './map.config';

// MapTiler regroupe commerces, restaurants, stations de transport/métro,
// tourisme, santé, sport... sous le source-layer "poi" — DA (section 8) :
// POI réduits au minimum en usage moto, pas de clutter décoratif. On les
// retire tous plutôt que de maintenir une liste au cas par cas.
const POI_SOURCE_LAYER = 'poi';

export async function loadNavigationMapStyle(): Promise<StyleSpecification> {
  const response = await fetch(MAP_STYLE_URL);
  const style = (await response.json()) as StyleSpecification;

  const layers = style.layers.filter((layer) => {
    const sourceLayer = 'source-layer' in layer ? layer['source-layer'] : undefined;
    return sourceLayer !== POI_SOURCE_LAYER;
  });

  // MapTiler expose une source "attribution" sans "tiles" ni "url" — un
  // porte-texte pour le bandeau de crédits, pas une vraie source de tuiles.
  // Aucun layer ne la référence ; MapLibre Native râle dessus ("source must
  // have tiles") si on la laisse telle quelle.
  const usedSourceIds = new Set(layers.map((layer) => ('source' in layer ? layer.source : undefined)));
  const sources = Object.fromEntries(
    Object.entries(style.sources).filter(([id, source]) => {
      if (!usedSourceIds.has(id)) {
        return false;
      }
      return 'tiles' in source || 'url' in source || 'data' in source;
    }),
  );

  return { ...style, sources, layers };
}
