import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type React from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { colors, MockBanner, Text } from '../../ui';
import { styles } from './AiRouteGeneratorScreen.styles';

type JourneyType = 'loop' | 'point-to-point';
type DurationPreset = 'express' | 'balade' | 'roadtrip';

const CURVATURE_LEVELS = ['DIRECT', 'MODÉRÉ', 'SINUEUX', 'LACETS'] as const;
const DURATION_STEP_MIN = 15;

interface CheckRowProps {
  readonly icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  readonly title: string;
  readonly subtitle: string;
  readonly checked: boolean;
  readonly onToggle: () => void;
}

function CheckRow({ icon, title, subtitle, checked, onToggle }: CheckRowProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={title}
      onPress={onToggle}
      style={styles.optionRow}
    >
      <View style={styles.optionRowLeft}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.textPrimary} />
        <View style={styles.optionTexts}>
          <Text variant="body" style={{ fontSize: 15, fontWeight: '700' }}>
            {title}
          </Text>
          <Text variant="mono" color={colors.textDense} style={{ textTransform: 'none' }}>
            {subtitle}
          </Text>
        </View>
      </View>
      <View style={[styles.checkMark, checked ? styles.checkMarkOn : styles.checkMarkOff]}>
        {checked ? <MaterialCommunityIcons name="check" size={14} color={colors.onAccentLight} /> : null}
      </View>
    </Pressable>
  );
}

// Aperçu visuel du générateur d'itinéraire par IA — hors périmètre V1
// documenté (voir CLAUDE.md) : aucun modèle, aucun calcul de corridor réel
// derrière. Les contrôles réagissent localement (sélection, saisie) pour
// donner une idée fidèle de l'interaction, mais le bouton final n'aboutit à
// rien de fonctionnel.
export function AiRouteGeneratorScreen(): React.JSX.Element {
  const [journeyType, setJourneyType] = useState<JourneyType>('loop');
  const [curvatureLevel, setCurvatureLevel] = useState(3);
  const [durationPreset, setDurationPreset] = useState<DurationPreset>('balade');
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [avoidHighways, setAvoidHighways] = useState(true);
  const [avoidGravel, setAvoidGravel] = useState(true);
  const [scenicRoads, setScenicRoads] = useState(true);
  const [poiPasses, setPoiPasses] = useState(true);
  const [poiCafe, setPoiCafe] = useState(true);
  const [poiViewpoint, setPoiViewpoint] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handlePresetPress = (preset: DurationPreset, minutes: number): void => {
    setDurationPreset(preset);
    setDurationMinutes(minutes);
  };

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="title" style={{ fontSize: 24, fontWeight: '700' }}>
            Générateur IA
          </Text>
        </View>
        <View style={styles.modelBadge}>
          <View style={styles.liveDot} />
          <Text variant="mono" color={colors.accentLight} style={{ fontSize: 11 }}>
            Modèle embarqué
          </Text>
        </View>
      </View>

      <View style={styles.subtitleRow}>
        <MaterialCommunityIcons name="wifi-off" size={14} color={colors.textDense} />
        <Text variant="mono" color={colors.textDense}>
          Calcul local · zéro surcoût API · 100% hors-ligne
        </Text>
      </View>

      <MockBanner message="Aperçu — génération d'itinéraire par IA hors périmètre V1, pas construite." />

      <View style={styles.segmented}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: journeyType === 'loop' }}
          onPress={() => {
            setJourneyType('loop');
          }}
          style={[styles.segmentedOption, journeyType === 'loop' ? styles.segmentedOptionActive : null]}
        >
          <MaterialCommunityIcons name="infinity" size={18} color={colors.textPrimary} />
          <View>
            <Text variant="body" style={{ fontSize: 15, fontWeight: '700' }}>
              Boucle
            </Text>
            <Text variant="mono" color={colors.textDense} style={{ fontSize: 10 }}>
              Départ = arrivée
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: journeyType === 'point-to-point' }}
          onPress={() => {
            setJourneyType('point-to-point');
          }}
          style={[
            styles.segmentedOption,
            journeyType === 'point-to-point' ? styles.segmentedOptionActive : null,
          ]}
        >
          <MaterialCommunityIcons name="arrow-right-bold" size={16} color={colors.textDense} />
          <View>
            <Text variant="body" color={colors.textDense} style={{ fontSize: 15 }}>
              Point A → B
            </Text>
            <Text variant="mono" color={colors.textDense} style={{ fontSize: 10 }}>
              Point de chute
            </Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <MaterialCommunityIcons name="road-variant" size={18} color={colors.textPrimary} />
            <Text variant="body" style={{ fontSize: 17, fontWeight: '700', textTransform: 'uppercase' }}>
              Indice de sinuosité
            </Text>
          </View>
          <View style={styles.levelPill}>
            <Text variant="monoBold" color={colors.onAccentLight}>
              Niveau {curvatureLevel + 1}/4
            </Text>
          </View>
        </View>

        <Text variant="body" style={{ fontSize: 16, fontWeight: '600' }}>
          {curvatureLevel === 3 ? 'Cols & lacets extrêmes' : 'Ajuste le style de conduite'}
        </Text>

        <View style={styles.curvatureRow}>
          {CURVATURE_LEVELS.map((label, index) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityState={{ selected: curvatureLevel === index }}
              onPress={() => {
                setCurvatureLevel(index);
              }}
              style={[styles.curvatureOption, curvatureLevel === index ? styles.curvatureOptionActive : null]}
            >
              <Text
                variant="monoBold"
                color={curvatureLevel === index ? colors.onAccentLight : colors.textDense}
                style={{ fontSize: 12 }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.cardHeader}>
          <Text variant="mono" color={colors.textDense} style={{ fontSize: 11, textTransform: 'none' }}>
            0° pente douce
          </Text>
          <Text variant="mono" color={colors.accentLight} style={{ fontSize: 11, textTransform: 'none' }}>
            · 420+ virages estimés
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <MaterialCommunityIcons name="clock-outline" size={18} color={colors.textPrimary} />
            <Text variant="body" style={{ fontSize: 17, fontWeight: '700', textTransform: 'uppercase' }}>
              Durée & distance cible
            </Text>
          </View>
          <Text variant="monoBold" color={colors.accentLight}>
            ~165 KM
          </Text>
        </View>

        <View style={styles.presetsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: durationPreset === 'express' }}
            onPress={() => {
              handlePresetPress('express', 90);
            }}
            style={[styles.presetOption, durationPreset === 'express' ? styles.presetOptionActive : null]}
          >
            <Text
              variant="body"
              color={durationPreset === 'express' ? colors.onAccentLight : colors.textDense}
              style={{ fontSize: 15, fontWeight: '700' }}
            >
              1h30
            </Text>
            <Text
              variant="mono"
              color={durationPreset === 'express' ? colors.onAccentLight : colors.textDense}
              style={{ fontSize: 10, textTransform: 'none' }}
            >
              Express
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: durationPreset === 'balade' }}
            onPress={() => {
              handlePresetPress('balade', 180);
            }}
            style={[styles.presetOption, durationPreset === 'balade' ? styles.presetOptionActive : null]}
          >
            <Text
              variant="body"
              color={durationPreset === 'balade' ? colors.onAccentLight : colors.textDense}
              style={{ fontSize: 15, fontWeight: '700' }}
            >
              3h00
            </Text>
            <Text
              variant="mono"
              color={durationPreset === 'balade' ? colors.onAccentLight : colors.textDense}
              style={{ fontSize: 10, textTransform: 'none' }}
            >
              Idéal balade
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: durationPreset === 'roadtrip' }}
            onPress={() => {
              handlePresetPress('roadtrip', 480);
            }}
            style={[styles.presetOption, durationPreset === 'roadtrip' ? styles.presetOptionActive : null]}
          >
            <Text
              variant="body"
              color={durationPreset === 'roadtrip' ? colors.onAccentLight : colors.textDense}
              style={{ fontSize: 15, fontWeight: '700' }}
            >
              Journée
            </Text>
            <Text
              variant="mono"
              color={durationPreset === 'roadtrip' ? colors.onAccentLight : colors.textDense}
              style={{ fontSize: 10, textTransform: 'none' }}
            >
              Roadtrip
            </Text>
          </Pressable>
        </View>

        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Réduire la durée"
            hitSlop={8}
            onPress={() => {
              setDurationMinutes((value) => Math.max(DURATION_STEP_MIN, value - DURATION_STEP_MIN));
            }}
            style={styles.stepperButton}
          >
            <MaterialCommunityIcons name="minus" size={18} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.stepperValue}>
            <Text variant="monoBold" tabularNums style={{ fontSize: 22 }}>
              {String(hours).padStart(2, '0')} h {String(minutes).padStart(2, '0')}
            </Text>
            <Text variant="mono" color={colors.textDense} style={{ fontSize: 11 }}>
              Corridor 150 – 180 km
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Augmenter la durée"
            hitSlop={8}
            onPress={() => {
              setDurationMinutes((value) => value + DURATION_STEP_MIN);
            }}
            style={styles.stepperButton}
          >
            <MaterialCommunityIcons name="plus" size={18} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderLeft}>
          <MaterialCommunityIcons name="filter-variant" size={18} color={colors.textPrimary} />
          <Text variant="body" style={{ fontSize: 17, fontWeight: '700', textTransform: 'uppercase' }}>
            Critères bitume & tracé
          </Text>
        </View>

        <CheckRow
          icon="highway"
          title="Éviter autoroutes & voies rapides"
          subtitle="Priorité absolue au réseau secondaire"
          checked={avoidHighways}
          onToggle={() => {
            setAvoidHighways((value) => !value);
          }}
        />
        <CheckRow
          icon="road"
          title="Revêtement sain · zéro gravillons"
          subtitle="Alertes communautaires intégrées"
          checked={avoidGravel}
          onToggle={() => {
            setAvoidGravel((value) => !value);
          }}
        />
        <CheckRow
          icon="image-filter-vintage"
          title="Départementales pittoresques"
          subtitle="Gorges, combes et balcons naturels"
          checked={scenicRoads}
          onToggle={() => {
            setScenicRoads((value) => !value);
          }}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <MaterialCommunityIcons name="map-marker-star-outline" size={18} color={colors.textPrimary} />
            <Text variant="body" style={{ fontSize: 17, fontWeight: '700', textTransform: 'uppercase' }}>
              {'Halte & éléments remarquables'}
            </Text>
          </View>
          <Text variant="mono" color={colors.textDense} style={{ fontSize: 11, textTransform: 'none' }}>
            3 suggérés
          </Text>
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: poiPasses }}
          onPress={() => {
            setPoiPasses((value) => !value);
          }}
          style={styles.poiRow}
        >
          <View style={[styles.checkMark, poiPasses ? styles.checkMarkOn : styles.checkMarkOff]}>
            {poiPasses ? <MaterialCommunityIcons name="check" size={14} color={colors.onAccentLight} /> : null}
          </View>
          <Text variant="body" style={{ fontSize: 14, fontWeight: '600' }}>
            2 cols panoramiques (alt. &gt; 1200m)
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: poiCafe }}
          onPress={() => {
            setPoiCafe((value) => !value);
          }}
          style={styles.poiRow}
        >
          <View style={[styles.checkMark, poiCafe ? styles.checkMarkOn : styles.checkMarkOff]}>
            {poiCafe ? <MaterialCommunityIcons name="check" size={14} color={colors.onAccentLight} /> : null}
          </View>
          <Text variant="body" style={{ fontSize: 14, fontWeight: '600' }}>
            Pause café / spot motard recommandé
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: poiViewpoint }}
          onPress={() => {
            setPoiViewpoint((value) => !value);
          }}
          style={styles.poiRow}
        >
          <View style={[styles.checkMark, poiViewpoint ? styles.checkMarkOn : styles.checkMarkOff]}>
            {poiViewpoint ? (
              <MaterialCommunityIcons name="check" size={14} color={colors.onAccentLight} />
            ) : null}
          </View>
          <Text variant="body" style={{ fontSize: 14, fontWeight: '600' }}>
            Belvédère photo · arrêt sécurisé
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text variant="mono" color={colors.textDense}>
            Consigne naturelle (optionnel)
          </Text>
        </View>
        <View style={styles.promptInputWrapper}>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Ex. boucle sinueuse, bon bitume, halte café"
            placeholderTextColor={colors.textDense}
            multiline
            style={styles.promptInput}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dicter la consigne"
            style={styles.micButton}
          >
            <MaterialCommunityIcons name="microphone" size={18} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.corridorEstimate}>
        <View style={styles.corridorEstimateLeft}>
          <MaterialCommunityIcons name="chip" size={14} color={colors.textDense} />
          <Text variant="mono" color={colors.textDense} style={{ fontSize: 11, textTransform: 'none' }}>
            Pré-calcul corridor embarqué
          </Text>
        </View>
        <Text variant="monoBold" style={{ fontSize: 12 }}>
          ~22 Mo inclus
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Générer l'itinéraire IA"
        onPress={() => {
          router.push('/ai-route-preview');
        }}
        style={styles.generateButton}
      >
        <MaterialCommunityIcons name="creation" size={22} color={colors.onAccentLight} />
        <Text
          variant="title"
          color={colors.onAccentLight}
          style={{ fontSize: 18, fontWeight: '700', letterSpacing: 0.9 }}
        >
          Générer l&apos;itinéraire IA
        </Text>
      </Pressable>
    </ScrollView>
  );
}
