import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  type AddressSuggestionDto,
  AI_ROUTE_MAX_DURATION_MINUTES,
  AI_ROUTE_NOTES_MAX_LENGTH,
  type GenerateAiRouteRequestDto,
} from '@roadtalk/contracts';
import { router } from 'expo-router';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLastKnownPosition } from '../../lib/useLastKnownPosition';
import { colors, Snackbar, spacing, Text, Toggle, useSnackbar } from '../../ui';
import { useAiRouteStore } from './aiRoute.store';
import { styles } from './AiRouteGeneratorScreen.styles';
import { PlacePickerSheet } from './PlacePickerSheet';

type TripType = GenerateAiRouteRequestDto['tripType'];
type Sinuosity = GenerateAiRouteRequestDto['sinuosity'];
type RoadPreference = GenerateAiRouteRequestDto['roadPreferences'][number];
type StopKind = GenerateAiRouteRequestDto['stopKinds'][number];

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
const MAX_DURATION_HOURS = AI_ROUTE_MAX_DURATION_MINUTES / 60;

function formatDurationHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${String(wholeHours)} h ${String(minutes).padStart(2, '0')}`;
}

const START_DEFAULT = { label: 'Ma position', icon: 'crosshairs-gps' } as const;
const DESTINATION_DEFAULT = { label: 'Au choix de l’IA', icon: 'creation' } as const;

// Départ et arrivée ne quittent le téléphone que vers notre API, qui n'en
// transmet que la commune au modèle d'IA (ADR-004).
export function AiRouteGeneratorScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const snackbar = useSnackbar();
  const { positionRef, hasFix } = useLastKnownPosition(true);
  const isGenerating = useAiRouteStore((state) => state.isGenerating);
  const generate = useAiRouteStore((state) => state.generate);
  // La génération dure jusqu'à une minute : si l'écran a été quitté entre-
  // temps, ne pas y ramener le motard de force avec l'aperçu.
  const isMountedRef = useRef(true);
  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    [],
  );
  const [tripType, setTripType] = useState<TripType>('loop');
  const [durationHours, setDurationHours] = useState(3);
  const [sinuosity, setSinuosity] = useState<Sinuosity>('winding');
  const [roadPreferences, setRoadPreferences] = useState<ReadonlySet<RoadPreference>>(
    new Set<RoadPreference>(['avoidHighways']),
  );
  const [stopKinds, setStopKinds] = useState<ReadonlySet<StopKind>>(new Set<StopKind>(['coffee']));
  const [notes, setNotes] = useState('');
  // `undefined` : ma position (départ), arrivée au choix de l'IA (arrivée).
  const [startPlace, setStartPlace] = useState<AddressSuggestionDto | undefined>(undefined);
  const [destinationPlace, setDestinationPlace] = useState<AddressSuggestionDto | undefined>(
    undefined,
  );
  const [openPicker, setOpenPicker] = useState<'start' | 'destination' | undefined>(undefined);
  // Une arrivée choisie reste en mémoire si l'on repasse en boucle, mais
  // n'est envoyée que pour un aller simple.
  const destination = tripType === 'one-way' ? destinationPlace : undefined;

  const adjustDuration = (deltaHours: number): void => {
    setDurationHours((previous) =>
      Math.min(MAX_DURATION_HOURS, Math.max(MIN_DURATION_HOURS, previous + deltaHours)),
    );
  };

  const hasStart = startPlace !== undefined || hasFix;
  const canGenerate = hasStart && !isGenerating;

  const handleGenerate = (): void => {
    const origin = startPlace ?? positionRef.current;
    if (origin === undefined || isGenerating) {
      return;
    }
    const trimmedNotes = notes.trim();
    generate(
      {
        origin: { latitude: origin.latitude, longitude: origin.longitude },
        tripType,
        ...(destination !== undefined
          ? { destination: { latitude: destination.latitude, longitude: destination.longitude } }
          : {}),
        durationMinutes: Math.round(durationHours * 60),
        sinuosity,
        roadPreferences: [...roadPreferences],
        stopKinds: [...stopKinds],
        ...(trimmedNotes.length > 0 ? { notes: trimmedNotes } : {}),
      },
      { start: startPlace, destination },
    )
      .then(() => {
        if (isMountedRef.current) {
          router.push('/ai-route-preview');
        }
      })
      .catch((error: unknown) => {
        if (isMountedRef.current && error instanceof Error) {
          snackbar.show(error.message);
        }
      });
  };

  const footerHint = !hasStart
    ? 'En attente de ta position…'
    : isGenerating
      ? 'Composition de la balade, jusqu’à une minute.'
      : undefined;

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
        <Section title="Trajet">
          <OptionGroup options={TRIP_TYPES} value={tripType} onChange={setTripType} />
          <View style={styles.listCard}>
            <PlaceRow
              label="Départ"
              value={startPlace?.label ?? START_DEFAULT.label}
              isDefault={startPlace === undefined}
              onPress={() => {
                setOpenPicker('start');
              }}
            />
            {tripType === 'one-way' ? (
              <PlaceRow
                label="Arrivée"
                value={destinationPlace?.label ?? DESTINATION_DEFAULT.label}
                isDefault={destinationPlace === undefined}
                hasDivider
                onPress={() => {
                  setOpenPicker('destination');
                }}
              />
            ) : null}
          </View>
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
              <View
                key={preference.value}
                style={[styles.listRow, index > 0 ? styles.listRowDivider : null]}
              >
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
            maxLength={AI_ROUTE_NOTES_MAX_LENGTH}
            multiline
          />
        </Section>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        {footerHint !== undefined ? (
          <Text variant="caption" color={colors.textSecondary} style={styles.footerHint}>
            {footerHint}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Générer l'itinéraire"
          accessibilityState={{ disabled: !canGenerate, busy: isGenerating }}
          disabled={!canGenerate}
          onPress={handleGenerate}
          style={({ pressed }) => [
            styles.generateButton,
            !canGenerate ? styles.generateButtonDisabled : null,
            pressed ? styles.pressed : null,
          ]}
        >
          {isGenerating ? (
            <ActivityIndicator color={colors.onAccentLight} />
          ) : (
            <MaterialCommunityIcons name="creation" size={20} color={colors.onAccentLight} />
          )}
          <Text variant="title" color={colors.onAccentLight} style={styles.generateButtonLabel}>
            {isGenerating ? 'Génération…' : 'Générer'}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.snackbarWrapper, { bottom: insets.bottom + 96 }]}>
        <Snackbar message={snackbar.message} />
      </View>

      <PlacePickerSheet
        visible={openPicker !== undefined}
        title={openPicker === 'destination' ? 'Arrivée' : 'Départ'}
        defaultOption={openPicker === 'destination' ? DESTINATION_DEFAULT : START_DEFAULT}
        biasRef={positionRef}
        onSelect={(place) => {
          if (openPicker === 'destination') {
            setDestinationPlace(place);
          } else {
            setStartPlace(place);
          }
          setOpenPicker(undefined);
        }}
        onClose={() => {
          setOpenPicker(undefined);
        }}
      />
    </View>
  );
}

interface PlaceRowProps {
  readonly label: string;
  readonly value: string;
  // Valeur par défaut (ma position, choix de l'IA) : affichée en retrait.
  readonly isDefault: boolean;
  readonly hasDivider?: boolean;
  readonly onPress: () => void;
}

function PlaceRow({
  label,
  value,
  isDefault,
  hasDivider,
  onPress,
}: PlaceRowProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} : ${value}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.listRow,
        hasDivider === true ? styles.listRowDivider : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text variant="body" style={styles.listRowLabel}>
        {label}
      </Text>
      <Text
        variant="body"
        color={isDefault ? colors.textSecondary : colors.textPrimary}
        numberOfLines={1}
        style={styles.placeValue}
      >
        {value}
      </Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
    </Pressable>
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
function OptionGroup<T extends string>({
  options,
  value,
  onChange,
}: OptionGroupProps<T>): React.JSX.Element {
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
            <Text
              variant="captionStrong"
              color={isActive ? colors.textPrimary : colors.textSecondary}
              numberOfLines={1}
            >
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
