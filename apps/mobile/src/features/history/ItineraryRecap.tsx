import type React from 'react';
import { View } from 'react-native';

import { colors, Text } from '../../ui';
import { styles } from './ItineraryRecap.styles';
import type { ResolvedRecapStep } from './useItineraryRecap';

const COORDINATES_DECIMALS = 4;

interface Props {
  readonly steps: readonly ResolvedRecapStep[];
}

function stepTitle(step: ResolvedRecapStep): string {
  if (step.address !== undefined) {
    return step.address.label;
  }
  if (step.hasFailed) {
    return `${step.latitude.toFixed(COORDINATES_DECIMALS)}, ${step.longitude.toFixed(COORDINATES_DECIMALS)}`;
  }
  return 'Recherche de l’adresse…';
}

// Le parcours ligne par ligne : départ, arrêts, arrivée, chacun avec son
// adresse. Même dessin de frise que la feuille de route de l'itinéraire IA.
export function ItineraryRecap({ steps }: Props): React.JSX.Element {
  return (
    <View style={styles.card}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const context = step.address?.context ?? undefined;

        return (
          <View key={`${String(index)}-${step.caption}`} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  step.kind === 'end' ? styles.dotEnd : null,
                  step.kind === 'stop' ? styles.dotStop : null,
                ]}
              />
              {!isLast ? <View style={styles.connector} /> : null}
            </View>
            <View style={[styles.texts, isLast ? styles.textsLast : null]}>
              <Text variant="caption" color={colors.textSecondary}>
                {step.caption}
              </Text>
              <Text
                variant="body"
                color={step.address !== undefined ? colors.textPrimary : colors.textSecondary}
                numberOfLines={2}
              >
                {stepTitle(step)}
              </Text>
              {context !== undefined ? (
                <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  {context}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
