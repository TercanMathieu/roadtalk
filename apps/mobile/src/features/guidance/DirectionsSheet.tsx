import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, Text } from '../../ui';
import { formatManeuverDistance } from '../routing/format';
import { styles } from './DirectionsSheet.styles';
import { getManeuverIcon } from './maneuver-icons';
import { getManeuverLabel } from './maneuver-labels';
import type { ManeuverStep } from './route-progress';

const ICON_SIZE = 24;
const CLOSE_ICON_SIZE = 22;

interface Props {
  readonly visible: boolean;
  readonly steps: readonly ManeuverStep[];
  readonly onClose: () => void;
}

// Récapitulatif détaillé de toutes les manœuvres du trajet — déclenché
// depuis le pied de guidage (GuidanceFooter), pas le résumé glanceable
// affiché en roulant (ManeuverBanner, sans nom de rue). Ouvert par appui,
// pas par un vrai geste de balayage : aucune lib de gestes dans le projet, et
// une cible large à l'appui reste plus fiable aux gants (C2) qu'un drag
// précis — `Modal` en anime déjà l'arrivée depuis le bas.
export function DirectionsSheet({ visible, steps, onClose }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm, paddingBottom: spacing.sm }]}>
          <Text variant="title">Étapes de l'itinéraire</Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fermer le récapitulatif"
            style={styles.closeButton}
          >
            <MaterialCommunityIcons name="close" size={CLOSE_ICON_SIZE} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: spacing.md + insets.bottom }]}>
          {steps.map((step, index) => (
            <View
              key={`${step.maneuver.type}-${String(index)}`}
              style={[styles.row, index === steps.length - 1 ? { borderBottomWidth: 0 } : null]}
            >
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons
                  name={getManeuverIcon(step.maneuver.type)}
                  size={ICON_SIZE}
                  color={colors.background}
                />
              </View>
              <View style={styles.texts}>
                <Text variant="body">{getManeuverLabel(step.maneuver)}</Text>
                {step.maneuver.streetName !== undefined ? (
                  <Text variant="label" color={colors.textSecondary} numberOfLines={1} style={styles.streetName}>
                    {step.maneuver.streetName}
                  </Text>
                ) : null}
              </View>
              {step.segmentDistance > 0 ? (
                <Text variant="body" color={colors.textSecondary} tabularNums>
                  {formatManeuverDistance(step.segmentDistance)}
                </Text>
              ) : null}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
