import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AddressSuggestionDto } from '@roadtalk/contracts';
import type React from 'react';
import { useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, View } from 'react-native';

import { colors, Text } from '../../ui';
import { styles } from './ReorderableStepRow.styles';
import { styles as cardStyles } from './TripSummaryCard.styles';

const ICON_SIZE = 18;
// Hauteur de ligne + espacement (stepRow minHeight 48 + stepsList gap 0,
// voir TripSummaryCard.styles.ts) : sert à convertir une distance de
// glissement en nombre de rangs déplacés.
const ROW_PITCH = 48;

// Catégories réelles que l'utilisateur choisit lui-même — jamais une donnée
// devinée par l'app (pas d'altitude inventée type "Col 1011m" : aucune
// source d'élévation n'est intégrée aujourd'hui, inventer le chiffre serait
// trompeur).
const TAG_PRESETS = ['Café', 'Essence', 'Repas', 'Point de vue'] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface Props {
  readonly index: number;
  readonly count: number;
  readonly stop: AddressSuggestionDto;
  readonly tag: string | undefined;
  readonly onRemove: () => void;
  readonly onReorder: (fromIndex: number, toIndex: number) => void;
  readonly onSetTag: (tag: string | undefined) => void;
}

// Glisser-déposer résolu au relâchement, pas en permutation ligne par ligne
// pendant le geste : plus robuste à construire/vérifier sans pouvoir tester
// sur appareil, même logique de base (PanResponder créé une seule fois,
// lectures via refs) que le swipe de la feuille de route elle-même.
export function ReorderableStepRow({
  index,
  count,
  stop,
  tag,
  onRemove,
  onReorder,
  onSetTag,
}: Props): React.JSX.Element {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const dragY = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(index);
  indexRef.current = index;
  const countRef = useRef(count);
  countRef.current = count;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gestureState) =>
        Math.abs(gestureState.dy) > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderMove: Animated.event([null, { dy: dragY }], { useNativeDriver: false }),
      onPanResponderRelease: (_event, gestureState) => {
        const delta = Math.round(gestureState.dy / ROW_PITCH);
        const toIndex = clamp(indexRef.current + delta, 0, countRef.current - 1);
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: false,
          damping: 18,
          mass: 0.6,
          stiffness: 180,
        }).start();
        if (toIndex !== indexRef.current) {
          onReorder(indexRef.current, toIndex);
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragY, { toValue: 0, useNativeDriver: false }).start();
      },
    }),
  ).current;

  return (
    <Animated.View style={[cardStyles.stepRow, { transform: [{ translateY: dragY }], zIndex: 1 }]}>
      <View style={cardStyles.stepBadge}>
        <Text variant="captionStrong" color={colors.textPrimary}>
          {index + 1}
        </Text>
      </View>
      <View style={cardStyles.stepTexts}>
        <View style={styles.tagRow}>
          <Text variant="caption" color={colors.textSecondary} style={cardStyles.stepLabel}>
            {`Étape ${String(index + 1)}`}
          </Text>
          <Pressable
            onPress={() => {
              setIsPickerOpen((previous) => !previous);
            }}
            accessibilityRole="button"
            accessibilityLabel={tag !== undefined ? `Catégorie : ${tag}` : "Ajouter une catégorie à l'étape"}
            style={tag !== undefined ? styles.tag : styles.addTag}
          >
            <Text
              variant="captionStrong"
              color={tag !== undefined ? colors.accent : colors.textSecondary}
              style={tag !== undefined ? styles.tagLabel : styles.addTagLabel}
            >
              {tag ?? '+ Catégorie'}
            </Text>
          </Pressable>
        </View>
        <Text variant="body" numberOfLines={1} style={cardStyles.stepAddress}>
          {stop.label}
        </Text>
        {isPickerOpen ? (
          <View style={styles.picker}>
            {TAG_PRESETS.map((preset) => (
              <Pressable
                key={preset}
                onPress={() => {
                  onSetTag(preset);
                  setIsPickerOpen(false);
                }}
                style={[styles.pickerChip, tag === preset ? styles.pickerChipActive : null]}
              >
                <Text
                  variant="label"
                  color={tag === preset ? colors.onAccentLight : colors.textPrimary}
                  style={styles.pickerChipLabel}
                >
                  {preset}
                </Text>
              </Pressable>
            ))}
            {tag !== undefined ? (
              <Pressable
                onPress={() => {
                  onSetTag(undefined);
                  setIsPickerOpen(false);
                }}
                style={styles.pickerChip}
              >
                <Text variant="label" color={colors.textSecondary} style={styles.pickerChipLabel}>
                  Aucune
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
      <View style={styles.stepActions}>
        <View {...panResponder.panHandlers} hitSlop={10} style={styles.dragHandle}>
          <MaterialCommunityIcons name="drag-vertical" size={ICON_SIZE} color={colors.textSecondary} />
        </View>
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Retirer l'arrêt ${stop.label}`}
          style={cardStyles.closeButton}
        >
          <MaterialCommunityIcons name="close" size={ICON_SIZE} color={colors.textSecondary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}
