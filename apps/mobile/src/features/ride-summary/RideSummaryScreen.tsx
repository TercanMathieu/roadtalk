import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { colors, MockBanner, Text } from '../../ui';
import { MetricCard } from './MetricCard';
import { styles } from './RideSummaryScreen.styles';

// Aperçu visuel de l'écran de résumé de balade (voir CLAUDE.md, hors
// périmètre V1 construit à ce jour) : aucun enregistrement de trace
// n'existe encore, donc aucune de ces valeurs (distance, vitesses,
// dénivelé, conditions, photos) ne vient d'une vraie balade.
export function RideSummaryScreen(): React.JSX.Element {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={12}
            onPress={() => {
              router.back();
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.accent} />
          </Pressable>
          <Text variant="title" style={{ fontSize: 24, fontWeight: '600', letterSpacing: -0.6 }}>
            DÉTAIL BALADE
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

      <MockBanner message="Aperçu — l'enregistrement de trace n'est pas encore construit." />

      <View style={styles.celebrationBanner}>
        <View style={styles.celebrationIcon}>
          <MaterialCommunityIcons name="flag-checkered" size={20} color={colors.accent} />
        </View>
        <View>
          <Text variant="title" style={{ fontSize: 24, fontWeight: '600' }}>
            Balade terminée !
          </Text>
          <Text variant="body" color={colors.textDense}>
            Trace enregistrée avec succès
          </Text>
        </View>
      </View>

      <View style={styles.mapCard}>
        <View style={styles.mapPlaceholder}>
          <MaterialCommunityIcons name="map-outline" size={32} color={colors.textDense} />
          <Text variant="label" color={colors.textDense}>
            Carte du tracé
          </Text>
          <View style={styles.mapLegend}>
            <View style={styles.mapLegendChip}>
              <View style={[styles.legendDot, { backgroundColor: colors.textPrimary }]} />
              <Text variant="label" color={colors.textDense}>
                Départ
              </Text>
            </View>
            <View style={styles.mapLegendChip}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
              <Text variant="label" color={colors.textDense}>
                Arrivée
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.rideTitleSection}>
          <View style={styles.rideTitleRow}>
            <Text
              variant="title"
              numberOfLines={1}
              style={[{ fontSize: 24, fontWeight: '700' }, styles.rideTitleText]}
            >
              Cols du Vercors & Combe Laval
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Renommer la balade" style={styles.editButton}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>
          <View style={styles.timestampRow}>
            <MaterialCommunityIcons name="clock-outline" size={15} color={colors.textDense} />
            <Text variant="mono" color={colors.textDense}>
              {"Aujourd'hui · 14:15 – 17:08 (2h53)"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statsSectionHeader}>
          <Text variant="mono" color={colors.textDense}>
            Télémétrie du parcours
          </Text>
          <Text variant="mono" color={colors.accent}>
            Données capteurs
          </Text>
        </View>

        <View style={styles.distanceCard}>
          <View>
            <Text variant="mono" color={colors.textDense}>
              Distance totale
            </Text>
            <View style={styles.distanceValueRow}>
              <Text variant="display" tabularNums style={{ fontSize: 48 }}>
                143.8
              </Text>
              <Text variant="monoBold" color={colors.accent}>
                km
              </Text>
            </View>
          </View>
          <View style={styles.distanceIcon}>
            <MaterialCommunityIcons name="ruler" size={24} color={colors.accent} />
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard icon="speedometer" label="Vitesse moy." value="58.4" unit="km/h" />
          <MetricCard icon="trending-up" label="Vitesse max" value="96" unit="km/h" />
        </View>
        <View style={styles.metricsGrid}>
          <MetricCard icon="image-filter-hdr" label="Dénivelé (D+)" value="+1 840" unit="m" />
          <MetricCard icon="coffee-outline" label="Temps de pause" value="18" unit="min" />
        </View>
      </View>

      <View style={styles.conditionsRow}>
        <View style={styles.conditionsLeft}>
          <View style={styles.conditionsIcon}>
            <MaterialCommunityIcons name="motorbike" size={20} color={colors.textPrimary} />
          </View>
          <View>
            <Text variant="body">Conditions idéales</Text>
            <Text variant="mono" color={colors.textDense}>
              Sec · 22°C · Asphalte parfait
            </Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Voir les photos" style={styles.photosButton}>
          <MaterialCommunityIcons name="camera-outline" size={16} color={colors.textDense} />
          <Text variant="mono" color={colors.textDense}>
            Photos (3)
          </Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Exporter la trace GPX" style={styles.primaryAction}>
          <MaterialCommunityIcons name="tray-arrow-down" size={20} color={colors.onAccentLight} />
          <Text variant="title" color={colors.onAccentLight} style={{ fontSize: 20, fontWeight: '700' }}>
            {'Exporter la trace GPX'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sauvegarder dans l'historique"
          style={styles.secondaryAction}
        >
          <MaterialCommunityIcons name="bookmark-outline" size={20} color={colors.textPrimary} />
          <Text variant="title" style={{ fontSize: 18, fontWeight: '700' }}>
            Sauvegarder dans l&apos;historique
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Renommer ou ajouter un carnet de notes"
          style={styles.tertiaryAction}
        >
          <MaterialCommunityIcons name="note-text-outline" size={18} color={colors.textDense} />
          <Text variant="body" color={colors.textDense}>
            Renommer ou ajouter un carnet de notes
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
