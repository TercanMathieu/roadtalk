import type { AddressSuggestionDto } from '@roadtalk/contracts';
import type React from 'react';
import { View } from 'react-native';

import { colors, Text } from '../../ui';
import { styles } from './RouteLabelCard.styles';

interface Props {
  // Toujours au moins un arrêt quand ce composant est monté (voir MapScreen).
  readonly stops: readonly AddressSuggestionDto[];
  readonly top: number;
}

// Pas de nom d'itinéraire généré ("Boucle du Vercors" etc.) : aucune source
// de données ne permet d'en déduire un honnêtement. Titre = la destination
// réellement choisie, sous-titre = les étapes intermédiaires réelles, s'il y
// en a — jamais de texte inventé qui pourrait passer pour une info réelle.
export function RouteLabelCard({ stops, top }: Props): React.JSX.Element | null {
  const lastStop = stops.at(-1);
  if (lastStop === undefined) {
    return null;
  }

  const intermediateStops = stops.slice(0, -1);
  const subtitle = intermediateStops.map((stop) => stop.label).join(' • ');

  return (
    <View style={[styles.card, { top }]}>
      <View style={styles.titleRow}>
        <View style={styles.dot} />
        <Text variant="title" numberOfLines={1} style={styles.title}>
          {lastStop.label}
        </Text>
      </View>
      {subtitle.length > 0 ? (
        <Text variant="mono" color={colors.accent} numberOfLines={1} style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
