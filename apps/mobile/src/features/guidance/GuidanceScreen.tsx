import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type React from 'react';
import { Pressable, View } from 'react-native';

import { colors, MockBanner, Text } from '../../ui';
import { styles } from './GuidanceScreen.styles';

const ICON_SIZE_LG = 32;
const ICON_SIZE_MD = 22;

// Aperçu visuel de l'écran de guidage turn-by-turn (voir CLAUDE.md, hors
// périmètre V1 construit à ce jour) : aucun moteur de guidage, de
// correspondance de trace, ni de détection de zone de danger derrière.
// Toutes les valeurs (manœuvre, vitesse, cap…) sont fixes, pour donner une
// idée fidèle du rendu — jamais lues d'un capteur ou recalculées.
export function GuidanceScreen(): React.JSX.Element {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quitter le guidage"
            hitSlop={12}
            onPress={() => {
              router.back();
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={ICON_SIZE_MD} color={colors.textPrimary} />
          </Pressable>
          <Text variant="title" style={[{ fontSize: 24, fontWeight: '600' }, styles.headerTitle]}>
            GUIDAGE COCKPIT
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.gpsBadge}>
            <MaterialCommunityIcons name="satellite-variant" size={16} color={colors.textDense} />
            <Text variant="mono" color={colors.textDense}>
              GPS
            </Text>
          </View>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account-circle" size={20} color={colors.onAccentLight} />
          </View>
        </View>
      </View>

      <View style={styles.mockBannerWrapper}>
        <MockBanner message="Aperçu — moteur de guidage turn-by-turn pas encore construit." />
      </View>

      <View style={styles.instructionBar}>
        <View style={styles.instructionRow}>
          <View style={styles.turnIcon}>
            <MaterialCommunityIcons
              name="arrow-top-right-thick"
              size={ICON_SIZE_LG}
              color={colors.accent}
            />
          </View>
          <View style={styles.instructionTexts}>
            <View style={styles.distanceRow}>
              <Text variant="display" color={colors.textPrimary} tabularNums style={{ fontSize: 64 }}>
                250
              </Text>
              <Text variant="monoBold" color={colors.accentLight}>
                mètres
              </Text>
            </View>
            <View style={styles.roadRow}>
              <Text variant="title" style={{ fontSize: 24, fontWeight: '700' }}>
                D76
              </Text>
              <Text variant="body" color={colors.textDense}>
                · Col de la Machine
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.dangerAlert}>
          <View style={styles.dangerAlertLeft}>
            <MaterialCommunityIcons name="alert" size={24} color={colors.onDangerSolid} />
            <Text variant="title" color={colors.onDangerSolid} style={{ fontSize: 24, fontWeight: '700' }}>
              {'ZONE DE\nDANGER'}
            </Text>
          </View>
          <Text variant="monoBold" color={colors.onDangerSolid} style={{ fontSize: 28 }}>
            {'1.2\nKM'}
          </Text>
        </View>
      </View>

      <View style={styles.corridor}>
        <View style={styles.compassBadge}>
          <MaterialCommunityIcons name="compass-outline" size={16} color={colors.textPrimary} />
          <Text variant="monoBold" color={colors.textPrimary}>
            CAP 084°
          </Text>
        </View>

        <View style={styles.floatingButtons}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Recentrer la trace"
            style={styles.floatingButton}
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={ICON_SIZE_LG} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Activer le guidage voix intercom"
            style={styles.floatingButton}
          >
            <MaterialCommunityIcons name="volume-high" size={ICON_SIZE_LG} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.positionCursorWrapper}>
          <View style={styles.positionCursorGlow} />
          <View style={styles.positionCursor}>
            <MaterialCommunityIcons name="navigation" size={24} color={colors.accent} />
          </View>
        </View>
      </View>

      <View style={styles.telemetryBar}>
        <View style={styles.speedRow}>
          <View style={styles.speedGroup}>
            <Text variant="display" tabularNums style={{ fontSize: 64 }}>
              84
            </Text>
            <View style={styles.speedUnitColumn}>
              <Text variant="mono" color={colors.textDense}>
                KM/H
              </Text>
              <Text variant="monoBold" color={colors.accentLight}>
                RÉEL
              </Text>
            </View>
          </View>
          <View style={styles.speedLimitSign}>
            <View style={styles.speedLimitSignInner}>
              <Text
                variant="display"
                color={colors.onDangerContainer}
                tabularNums
                style={{ fontSize: 32 }}
              >
                80
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tripDataRow}>
          <View style={styles.tripDataColumn}>
            <Text variant="mono" color={colors.textDense}>
              TEMPS RESTANT
            </Text>
            <Text variant="monoBold" color={colors.textPrimary} tabularNums style={{ fontSize: 28 }}>
              1h12
            </Text>
          </View>
          <View style={styles.tripDataColumnCenter}>
            <Text variant="mono" color={colors.textDense}>
              DISTANCE
            </Text>
            <Text variant="monoBold" color={colors.textPrimary} tabularNums style={{ fontSize: 28 }}>
              54 km
            </Text>
          </View>
          <View style={styles.tripDataColumnEnd}>
            <Text variant="mono" color={colors.textDense}>
              ARRIVÉE
            </Text>
            <Text variant="monoBold" color={colors.accent} tabularNums style={{ fontSize: 28 }}>
              17:30
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Signaler un danger aux autres motards"
            style={[styles.actionButton, styles.signalButton]}
          >
            <MaterialCommunityIcons name="broadcast" size={24} color={colors.onDangerSolid} />
            <Text variant="title" color={colors.onDangerSolid} style={{ fontSize: 24, fontWeight: '700' }}>
              SIGNAL
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mettre la balade en pause"
            style={[styles.actionButton, styles.pauseButton]}
          >
            <MaterialCommunityIcons name="pause" size={24} color={colors.textPrimary} />
            <Text variant="title" style={{ fontSize: 24, fontWeight: '700' }}>
              PAUSE
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
