import type {
  StyleSpecification,
  SymbolLayerSpecification,
} from '@maplibre/maplibre-react-native';

import { MAP_STYLE_URL } from './map.config';

// MapTiler regroupe commerces, restaurants, stations de transport/métro,
// tourisme, santé, sport... sous le source-layer "poi" — DA (section 8) :
// POI réduits au minimum en usage moto, pas de clutter décoratif. On les
// retire tous plutôt que de maintenir une liste au cas par cas.
const POI_SOURCE_LAYER = 'poi';

// Calque des noms de rues dans le style MapTiler streets-v2.
const ROAD_LABEL_LAYER_ID = 'Road labels';

// En dessous, on survole une agglomération entière : les noms de rues n'y sont
// qu'un fouillis qu'on ne peut de toute façon pas lire. Le style d'origine les
// affiche dès le zoom 8.
const ROAD_LABEL_MIN_ZOOM = 14;

// Le style d'origine plafonne à 13 px au zoom 18, halo flou de 1 px : calibré
// pour un écran de bureau. Sur un téléphone au guidon, lu d'un coup d'œil et
// souvent en plein soleil, il faut du gros et du franchement contrasté (C2).
// Halo noir opaque et non flou : les libellés passent au-dessus de tracés de
// routes clairs comme foncés sans jamais s'y fondre.
function emphasizeRoadLabels(layer: SymbolLayerSpecification): SymbolLayerSpecification {
  return {
    ...layer,
    minzoom: ROAD_LABEL_MIN_ZOOM,
    layout: {
      ...layer.layout,
      'text-size': ['interpolate', ['linear'], ['zoom'], 14, 12, 17, 16, 20, 19],
    },
    paint: {
      ...layer.paint,
      'text-color': '#FFFFFF',
      'text-halo-color': '#000000',
      'text-halo-width': 1.6,
      'text-halo-blur': 0,
    },
  };
}

export async function loadNavigationMapStyle(): Promise<StyleSpecification> {
  const response = await fetch(MAP_STYLE_URL);
  const style = (await response.json()) as StyleSpecification;

  const layers = style.layers
    .filter((layer) => {
      const sourceLayer = 'source-layer' in layer ? layer['source-layer'] : undefined;
      return sourceLayer !== POI_SOURCE_LAYER;
    })
    .map((layer) =>
      layer.id === ROAD_LABEL_LAYER_ID && layer.type === 'symbol'
        ? emphasizeRoadLabels(layer)
        : layer,
    );

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
