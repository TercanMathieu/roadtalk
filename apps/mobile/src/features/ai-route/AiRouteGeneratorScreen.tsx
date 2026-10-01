import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type React from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, MockBanner, Snackbar, spacing, Text, useSnackbar } from '../../ui';
import { styles } from './AiRouteGeneratorScreen.styles';

const ICON_SIZE = 18;
const COMING_SOON_MESSAGE = "Générateur IA bientôt disponible.";

type TripType = 'loop' | 'point-to-point';
type SinuosityLevel = 'direct' | 'moderate' | 'winding' | 'hairpins';
type DurationPreset = 'express' | 'ideal' | 'roadtrip';

const SINUOSITY_LEVELS: readonly { value: SinuosityLevel; label: string; rank: number }[] = [
  { value: 'direct', label: 'DIRECT', rank: 1 },
  { value: 'moderate', label: 'MODÉRÉ', rank: 2 },
  { value: 'winding', label: 'SINUEUX', rank: 3 },
  { value: 'hairpins', label: 'LACETS', rank: 4 },
];

const DURATION_PRESETS: readonly { value: DurationPreset; hours: number; label: string; caption: string }[] = [
  { value: 'express', hours: 1.5, label: '1h30', caption: 'Express' },
  { value: 'ideal', hours: 3, label: '3h00', caption: 'Idéal balade' },
  { value: 'roadtrip', hours: 6, label: 'Journée', caption: 'Roadtrip' },
];

const DURATION_STEP_HOURS = 0.5;
const MIN_DURATION_HOURS = 1;
const MAX_DURATION_HOURS = 10;

function formatDurationHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${String(wholeHours).padStart(2, '0')} h ${String(minutes).padStart(2, '0')}`;
}

interface CriterionRow {
  readonly key: string;
  readonly icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  readonly title: string;
  readonly subtitle: string;
}

const ROAD_CRITERIA: readonly CriterionRow[] = [
  { key: 'avoidHighways', icon: 'highway', title: 'Éviter autoroutes et voies rapides', subtitle: 'Priorité absolue au réseau secondaire' },
  { key: 'goodSurface', icon: 'texture-box', title: 'Revêtement sain, zéro gravillons', subtitle: 'Alertes communautaires intégrées' },
  { key: 'scenic', icon: 'image-filter-hdr', title: 'Départementales pittoresques', subtitle: 'Gorges, combes et balcons naturels' },
];

interface PoiRow {
  readonly key: string;
  readonly label: string;
}

const SUGGESTED_POIS: readonly PoiRow[] = [
  { key: 'passes', label: 'Cols panoramiques (alt. > 1200 m)' },
  { key: 'coffee', label: 'Pause café, spot motard recommandé' },
  { key: 'viewpoint', label: 'Belvédère photo, arrêt sécurisé' },
];

// Aucun moteur de génération d'itinéraire n'existe (pas de modèle embarqué,
// pas de routage "sinuosité", pas de reconnaissance vocale) — tout cet écran
// est un aperçu interactif d'une fonctionnalité prévue, pas encore
// construite. Les contrôles réagissent localement (c'est un vrai formulaire),
// mais "Générer" ne mène nulle part : voir MockBanner en tête d'écran.
export function AiRouteGeneratorScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const snackbar = useSnackbar();
  const [tripType, setTripType] = useState<TripType>('loop');
  const [sinuosity, setSinuosity] = useState<SinuosityLevel>('hairpins');
  const [durationPreset, setDurationPreset] = useState<DurationPreset>('ideal');
  const [durationHours, setDurationHours] = useState(3);
  const [criteria, setCriteria] = useState<Record<string, boolean>>({
    avoidHighways: true,
    goodSurface: true,
    scenic: true,
  });
  const [pois, setPois] = useState<Record<string, boolean>>({ passes: true, coffee: true, viewpoint: false });
  const [prompt, setPrompt] = useState('');

  const sinuosityLevel = SINUOSITY_LEVELS.find((level) => level.value === sinuosity) ?? SINUOSITY_LEVELS[0];

  const handleSelectDurationPreset = (preset: DurationPreset): void => {
    setDurationPreset(preset);
    const matching = DURATION_PRESETS.find((entry) => entry.value === preset);
    if (matching !== undefined) {
      setDurationHours(matching.hours);
    }
  };

  const handleAdjustDuration = (deltaHours: number): void => {
    setDurationHours((previous) =>
      Math.min(MAX_DURATION_HOURS, Math.max(MIN_DURATION_HOURS, previous + deltaHours)),
    );
  };

  const toggleCriterion = (key: string): void => {
    setCriteria((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  const togglePoi = (key: string): void => {
    setPois((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        <MockBanner message="Aperçu — aucun moteur de génération IA n'existe encore, Générer ne produit rien." />

        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={8}
            onPress={() => {
              router.back();
            }}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color={colors.textPrimary} />
          </Pressable>
          <Text variant="title" style={styles.headerTitle}>
            Générateur IA
          </Text>
          <View style={styles.modelBadge}>
            <View style={styles.modelBadgeDot} />
            <Text variant="monoBold" color={colors.accentLight} style={styles.modelBadgeLabel}>
              MODÈLE EMBARQUÉ
            </Text>
          </View>
        </View>

        <View style={styles.tripTypeRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: tripType === 'loop' }}
            onPress={() => {
              setTripType('loop');
            }}
            style={[styles.tripTypeButton, tripType === 'loop' ? styles.tripTypeButtonActive : null]}
          >
            <MaterialCommunityIcons name="infinity" size={ICON_SIZE} color={colors.textPrimary} />
            <View>
              <Text variant="body" style={styles.tripTypeLabel}>
                Boucle
              </Text>
              <Text variant="mono" color={colors.textDense}>
                Départ = arrivée
              </Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: tripType === 'point-to-point' }}
            onPress={() => {
              setTripType('point-to-point');
            }}
            style={[styles.tripTypeButton, tripType === 'point-to-point' ? styles.tripTypeButtonActive : null]}
          >
            <MaterialCommunityIcons name="ray-start-arrow" size={ICON_SIZE} color={colors.textPrimary} />
            <View>
              <Text variant="body" style={styles.tripTypeLabel}>
                Point A → B
              </Text>
              <Text variant="mono" color={colors.textDense}>
                Point de chute
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderTitle}>
              <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={ICON_SIZE} color={colors.textPrimary} />
              <Text variant="title" style={styles.cardHeaderLabel}>
                Indice de sinuosité
              </Text>
            </View>
            <View style={styles.levelBadge}>
              <Text variant="monoBold" color={colors.onAccentLight}>
                Niveau {sinuosityLevel?.rank}/4
              </Text>
            </View>
          </View>

          <View style={styles.sinuosityButtons}>
            {SINUOSITY_LEVELS.map((level) => {
              const isActive = level.value === sinuosity;
              return (
                <Pressable
                  key={level.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => {
                    setSinuosity(level.value);
                  }}
                  style={[styles.sinuosityButton, isActive ? styles.sinuosityButtonActive : null]}
                >
                  <Text variant="monoBold" color={isActive ? colors.onAccentLight : colors.textDense}>
                    {level.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sinuosityCaption}>
            <Text variant="mono" color={colors.textDense}>
              0° pente douce
            </Text>
            <Text variant="monoBold" color={colors.accent}>
              · estimation indisponible
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderTitle}>
              <MaterialCommunityIcons name="clock-time-four-outline" size={ICON_SIZE} color={colors.textPrimary} />
              <Text variant="title" style={styles.cardHeaderLabel}>
                Durée et distance cible
              </Text>
            </View>
          </View>

          <View style={styles.durationPresets}>
            {DURATION_PRESETS.map((preset) => {
              const isActive = preset.value === durationPreset;
              return (
                <Pressable
                  key={preset.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => {
                    handleSelectDurationPreset(preset.value);
                  }}
                  style={[styles.durationPresetButton, isActive ? styles.durationPresetButtonActive : null]}
                >
                  <Text variant="body" color={isActive ? colors.onAccentLight : colors.textDense} style={styles.durationPresetValue}>
                    {preset.label}
                  </Text>
                  <Text variant="mono" color={isActive ? colors.onAccentLight : colors.textDense}>
                    {preset.caption}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.fineTuneRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Réduire la durée cible"
              hitSlop={8}
              onPress={() => {
                handleAdjustDuration(-DURATION_STEP_HOURS);
              }}
              style={styles.fineTuneButton}
            >
              <MaterialCommunityIcons name="minus" size={20} color={colors.textPrimary} />
            </Pressable>
            <View style={styles.fineTuneTexts}>
              <Text variant="title" tabularNums style={styles.fineTuneValue}>
                {formatDurationHours(durationHours)}
              </Text>
              <Text variant="mono" color={colors.textDense}>
                Corridor estimé indisponible
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Augmenter la durée cible"
              hitSlop={8}
              onPress={() => {
                handleAdjustDuration(DURATION_STEP_HOURS);
              }}
              style={styles.fineTuneButton}
            >
              <MaterialCommunityIcons name="plus" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderTitle}>
            <MaterialCommunityIcons name="filter-variant" size={ICON_SIZE} color={colors.textPrimary} />
            <Text variant="title" style={styles.cardHeaderLabel}>
              Critères bitume et tracé
            </Text>
          </View>

          <View style={styles.criteriaList}>
            {ROAD_CRITERIA.map((criterion) => (
              <Pressable
                key={criterion.key}
                accessibilityRole="switch"
                accessibilityState={{ checked: criteria[criterion.key] === true }}
                onPress={() => {
                  toggleCriterion(criterion.key);
                }}
                style={styles.criterionRow}
              >
                <MaterialCommunityIcons name={criterion.icon} size={ICON_SIZE} color={colors.textPrimary} />
                <View style={styles.criterionTexts}>
                  <Text variant="body">{criterion.title}</Text>
                  <Text variant="mono" color={colors.textDense}>
                    {criterion.subtitle}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={criteria[criterion.key] === true ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={20}
                  color={criteria[criterion.key] === true ? colors.accent : colors.textDense}
                />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.poiHeader}>
            <View style={styles.cardHeaderTitle}>
              <MaterialCommunityIcons name="map-marker-star-outline" size={ICON_SIZE} color={colors.textPrimary} />
              <Text variant="title" style={styles.cardHeaderLabel}>
                Halte et éléments remarquables
              </Text>
            </View>
            <Text variant="mono" color={colors.textDense} style={styles.poiCount}>
              {Object.values(pois).filter(Boolean).length} suggérés
            </Text>
          </View>

          <View style={styles.criteriaList}>
            {SUGGESTED_POIS.map((poi) => (
              <Pressable
                key={poi.key}
                accessibilityRole="switch"
                accessibilityState={{ checked: pois[poi.key] === true }}
                onPress={() => {
                  togglePoi(poi.key);
                }}
                style={styles.poiRow}
              >
                <View
                  style={[
                    styles.poiCheckbox,
                    pois[poi.key] === true ? styles.poiCheckboxChecked : styles.poiCheckboxUnchecked,
                  ]}
                >
                  {pois[poi.key] === true ? (
                    <MaterialCommunityIcons name="check" size={12} color={colors.onAccentLight} />
                  ) : null}
                </View>
                <Text variant="body" style={styles.poiLabel} numberOfLines={1}>
                  {poi.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text variant="mono" color={colors.textDense}>
              CONSIGNE NATURELLE (OPTIONNEL)
            </Text>
          </View>
          <View style={styles.promptRow}>
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Décris le trajet que tu imagines…"
              placeholderTextColor={colors.textSecondary}
              style={styles.promptInput}
              multiline
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dicter la consigne"
              onPress={() => {
                snackbar.show(COMING_SOON_MESSAGE);
              }}
              style={styles.promptVoiceButton}
            >
              <MaterialCommunityIcons name="microphone-outline" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.offlineInfoRow}>
          <View style={styles.cardHeaderTitle}>
            <MaterialCommunityIcons name="cloud-download-outline" size={15} color={colors.textDense} />
            <Text variant="mono" color={colors.textDense}>
              Pré-calcul corridor embarqué
            </Text>
          </View>
          <Text variant="monoBold" color={colors.textPrimary}>
            Indisponible
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Générer l'itinéraire IA"
          // Pas de génération réelle à lancer (voir bandeau en tête d'écran)
          // — mène directement à l'aperçu illustratif plutôt qu'un message
          // "bientôt disponible" qui ne montrerait rien du résultat visé.
          onPress={() => {
            router.push('/ai-route-preview');
          }}
          style={({ pressed }) => [styles.generateButton, pressed ? styles.generateButtonPressed : null]}
        >
          <MaterialCommunityIcons name="creation" size={24} color={colors.onAccentLight} />
          <Text variant="title" color={colors.onAccentLight} style={styles.generateButtonLabel}>
            Générer l'itinéraire IA
          </Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.snackbarWrapper, { bottom: insets.bottom + spacing.sm }]}>
        <Snackbar message={snackbar.message} />
      </View>
    </View>
  );
}
