import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, Text } from '../../ui';
import { formatManeuverDistance } from '../routing/format';
import { styles } from './DirectionsSheet.styles';
import { getManeuverLabel } from './maneuver-labels';
import { ManeuverIcon } from './ManeuverIcon';
import type { ManeuverStep } from './route-progress';

const ICON_SIZE = 24;
const STEP_ICON_SIZE = 28;
const CLOSE_ICON_SIZE = 22;

interface Props {
  readonly visible: boolean;
  // Uniquement les manœuvres encore à venir, la prochaine en premier — celles
  // déjà franchies n'ont plus d'intérêt en roulant.
  readonly steps: readonly ManeuverStep[];
  // Distance réelle jusqu'à la première de la liste (la prochaine manœuvre) ;
  // les suivantes affichent la distance qui les sépare de la précédente.
  readonly distanceToFirstMeters: number | undefined;
  readonly onClose: () => void;
  // Seul chemin de sortie du guidage depuis ce menu (voir GuidanceFooter,
  // qui n'a plus son propre bouton Quitter séparé).
  readonly onExitGuidance: () => void;
}

// Liste détaillée des manœuvres restantes — déclenchée depuis le pied de
// guidage (GuidanceFooter), en complément du bandeau glanceable affiché en
// roulant (ManeuverBanner, une seule manœuvre à la fois). Ouvert par appui,
// pas par un vrai geste de balayage : aucune lib de gestes dans le projet, et
// une cible large à l'appui reste plus fiable aux gants (C2) qu'un drag
// précis — `Modal` en anime déjà l'arrivée depuis le bas.
export function DirectionsSheet({
  visible,
  steps,
  distanceToFirstMeters,
  onClose,
  onExitGuidance,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm, paddingBottom: spacing.sm }]}>
          <Text variant="title" style={styles.title}>
            Prochaines étapes
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fermer le récapitulatif"
            style={styles.closeButton}
          >
            <MaterialCommunityIcons name="close" size={CLOSE_ICON_SIZE} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {steps.map((step, index) => (
            <View
              key={`${step.maneuver.type}-${String(index)}`}
              style={[styles.row, index === steps.length - 1 ? { borderBottomWidth: 0 } : null]}
            >
              <View style={styles.iconCircle}>
                <ManeuverIcon maneuver={step.maneuver} size={STEP_ICON_SIZE} color={colors.textPrimary} />
              </View>
              <View style={styles.texts}>
                <Text variant="body">{getManeuverLabel(step.maneuver)}</Text>
              </View>
              <Text variant="body" color={colors.textSecondary} tabularNums>
                {formatManeuverDistance(
                  index === 0 && distanceToFirstMeters !== undefined
                    ? distanceToFirstMeters
                    : step.distanceFromPrevious,
                )}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.exitSection, { paddingBottom: spacing.md + insets.bottom }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quitter le guidage"
            onPress={onExitGuidance}
            style={({ pressed }) => [styles.exitButton, pressed ? styles.exitButtonPressed : null]}
          >
            <MaterialCommunityIcons name="close-circle-outline" size={ICON_SIZE} color={colors.onDangerSolid} />
            <Text variant="title" color={colors.onDangerSolid} style={styles.exitButtonLabel}>
              Quitter le guidage
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
