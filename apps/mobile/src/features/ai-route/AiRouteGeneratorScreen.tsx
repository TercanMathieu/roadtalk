import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type React from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, MockBanner, spacing, Text, Toggle } from '../../ui';
import { styles } from './AiRouteGeneratorScreen.styles';

type TripType = 'loop' | 'one-way';
type Sinuosity = 'direct' | 'moderate' | 'winding' | 'hairpins';
type RoadPreference = 'avoidHighways' | 'goodSurface' | 'scenic';
type StopKind = 'passes' | 'coffee' | 'viewpoint';

interface Option<T extends string> {
  readonly value: T;
  readonly label: string;
}

const TRIP_TYPES: readonly Option<TripType>[] = [
  { value: 'loop', label: 'Boucle' },
  { value: 'one-way', label: 'Aller simple' },
];

const SINUOSITY_LEVELS: readonly Option<Sinuosity>[] = [
  { value: 'direct', label: 'Direct' },
  { value: 'moderate', label: 'Modéré' },
  { value: 'winding', label: 'Sinueux' },
  { value: 'hairpins', label: 'Lacets' },
];

const ROAD_PREFERENCES: readonly Option<RoadPreference>[] = [
  { value: 'avoidHighways', label: 'Éviter les autoroutes' },
  { value: 'goodSurface', label: 'Revêtement en bon état' },
  { value: 'scenic', label: 'Routes pittoresques' },
];

const STOP_KINDS: readonly Option<StopKind>[] = [
  { value: 'passes', label: 'Cols' },
  { value: 'coffee', label: 'Pause café' },
  { value: 'viewpoint', label: 'Point de vue' },
];

const DURATION_PRESETS_HOURS: readonly number[] = [1.5, 3, 6];
const DURATION_STEP_HOURS = 0.5;
const MIN_DURATION_HOURS = 1;
const MAX_DURATION_HOURS = 10;

function formatDurationHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${String(wholeHours)} h ${String(minutes).padStart(2, '0')}`;
}

// Aucun moteur de génération d'itinéraire n'existe (pas de modèle, pas de
// routage par sinuosité) : cet écran est l'aperçu interactif d'une fonction
// prévue. Les contrôles réagissent localement, mais "Générer" mène à un
// exemple illustratif (AiRoutePreviewScreen), jamais à un vrai calcul — voir
// MockBanner en tête d'écran.
export function AiRouteGeneratorScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [tripType, setTripType] = useState<TripType>('loop');
  const [durationHours, setDurationHours] = useState(3);
  const [sinuosity, setSinuosity] = useState<Sinuosity>('winding');
  const [roadPreferences, setRoadPreferences] = useState<ReadonlySet<RoadPreference>>(
    new Set<RoadPreference>(['avoidHighways']),
  );
  const [stopKinds, setStopKinds] = useState<ReadonlySet<StopKind>>(new Set<StopKind>(['coffee']));
  const [notes, setNotes] = useState('');

  const adjustDuration = (deltaHours: number): void => {
    setDurationHours((previous) => Math.min(MAX_DURATION_HOURS, Math.max(MIN_DURATION_HOURS, previous + deltaHours)));
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={8}
          onPress={() => {
            router.back();
          }}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text variant="title" style={styles.headerTitle}>
          Itinéraire IA
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <MockBanner message="Aperçu — la génération IA n'existe pas encore. Générer affiche un exemple." />

        <Section title="Trajet">
          <OptionGroup options={TRIP_TYPES} value={tripType} onChange={setTripType} />
        </Section>

        <Section title="Durée">
          <View style={styles.card}>
            <View style={styles.stepper}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Réduire la durée"
                hitSlop={8}
                onPress={() => {
                  adjustDuration(-DURATION_STEP_HOURS);
                }}
                style={({ pressed }) => [styles.stepperButton, pressed ? styles.pressed : null]}
              >
                <MaterialCommunityIcons name="minus" size={22} color={colors.textPrimary} />
              </Pressable>
              <Text variant="title" tabularNums style={styles.stepperValue}>
                {formatDurationHours(durationHours)}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Augmenter la durée"
                hitSlop={8}
                onPress={() => {
                  adjustDuration(DURATION_STEP_HOURS);
                }}
                style={({ pressed }) => [styles.stepperButton, pressed ? styles.pressed : null]}
              >
                <MaterialCommunityIcons name="plus" size={22} color={colors.textPrimary} />
              </Pressable>
            </View>
            <View style={styles.chipsRow}>
              {DURATION_PRESETS_HOURS.map((hours) => (
                <Chip
                  key={hours}
                  label={formatDurationHours(hours)}
                  isActive={hours === durationHours}
                  onPress={() => {
                    setDurationHours(hours);
                  }}
                />
              ))}
            </View>
          </View>
        </Section>

        <Section title="Sinuosité">
          <OptionGroup options={SINUOSITY_LEVELS} value={sinuosity} onChange={setSinuosity} />
        </Section>

        <Section title="Routes">
          <View style={styles.listCard}>
            {ROAD_PREFERENCES.map((preference, index) => (
              <View key={preference.value} style={[styles.listRow, index > 0 ? styles.listRowDivider : null]}>
                <Text variant="body" style={styles.listRowLabel}>
                  {preference.label}
                </Text>
                <Toggle
                  value={roadPreferences.has(preference.value)}
                  onValueChange={() => {
                    setRoadPreferences((previous) => toggled(previous, preference.value));
                  }}
                  accessibilityLabel={preference.label}
                />
              </View>
            ))}
          </View>
        </Section>

        <Section title="Haltes">
          <View style={styles.chipsRow}>
            {STOP_KINDS.map((stop) => (
              <Chip
                key={stop.value}
                label={stop.label}
                isActive={stopKinds.has(stop.value)}
                onPress={() => {
                  setStopKinds((previous) => toggled(previous, stop.value));
                }}
              />
            ))}
          </View>
        </Section>

        <Section title="Précisions (optionnel)">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Décris la balade que tu imagines…"
            placeholderTextColor={colors.textSecondary}
            style={styles.notesInput}
            multiline
          />
        </Section>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Générer l'itinéraire"
          // Pas de génération réelle à lancer (voir bandeau en tête d'écran) :
          // mène à l'aperçu illustratif, qui montre le résultat visé.
          onPress={() => {
            router.push('/ai-route-preview');
          }}
          style={({ pressed }) => [styles.generateButton, pressed ? styles.pressed : null]}
        >
          <MaterialCommunityIcons name="creation" size={20} color={colors.onAccentLight} />
          <Text variant="title" color={colors.onAccentLight} style={styles.generateButtonLabel}>
            Générer
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function toggled<T>(set: ReadonlySet<T>, value: T): ReadonlySet<T> {
  const next = new Set(set);
  if (!next.delete(value)) {
    next.add(value);
  }
  return next;
}

interface SectionProps {
  readonly title: string;
  readonly children: React.ReactNode;
}

function Section({ title, children }: SectionProps): React.JSX.Element {
  return (
    <View style={styles.section}>
      <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

interface OptionGroupProps<T extends string> {
  readonly options: readonly Option<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
}

// Choix exclusif sur toute la largeur (SegmentedToggle, lui, se dimensionne
// à son contenu — adapté à une ligne de réglage, pas à un champ de formulaire).
function OptionGroup<T extends string>({ options, value, onChange }: OptionGroupProps<T>): React.JSX.Element {
  return (
    <View style={styles.optionGroup}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              onChange(option.value);
            }}
            style={[styles.option, isActive ? styles.optionActive : null]}
          >
            <Text variant="captionStrong" color={isActive ? colors.textPrimary : colors.textSecondary} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface ChipProps {
  readonly label: string;
  readonly isActive: boolean;
  readonly onPress: () => void;
}

function Chip({ label, isActive, onPress }: ChipProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      style={[styles.chip, isActive ? styles.chipActive : null]}
    >
      <Text variant="captionStrong" color={isActive ? colors.accent : colors.textSecondary}>
        {label}
      </Text>
    </Pressable>
  );
}
