import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { colors, MockBanner, Text } from '../../ui';
import { styles } from './AiRoutePreviewScreen.styles';

interface MetricCardProps {
  readonly icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  readonly label: string;
  readonly children: React.ReactNode;
}

function MetricCard({ icon, label, children }: MetricCardProps): React.JSX.Element {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricCardHeader}>
        <Text variant="mono" color={colors.textDense}>
          {label}
        </Text>
        <MaterialCommunityIcons name={icon} size={14} color={colors.textDense} />
      </View>
      {children}
    </View>
  );
}

interface WaypointProps {
  readonly icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  readonly title: string;
  readonly distance: string;
  readonly note: string;
  readonly isLast?: boolean;
  readonly isEnd?: boolean;
}

function Waypoint({ icon, title, distance, note, isLast = false, isEnd = false }: WaypointProps): React.JSX.Element {
  return (
    <View style={styles.waypointRow}>
      <View style={styles.waypointMarkerColumn}>
        <View style={[styles.waypointMarker, isEnd ? styles.waypointMarkerEnd : null]}>
          <MaterialCommunityIcons
            name={icon}
            size={14}
            color={isEnd ? colors.onAccentLight : colors.textPrimary}
          />
        </View>
        {isLast ? null : <View style={styles.waypointLine} />}
      </View>
      <View style={styles.waypointTexts}>
        <View style={styles.waypointTitleRow}>
          <Text variant="body" style={{ fontSize: 16, fontWeight: '600' }}>
            {title}
          </Text>
          <Text variant="mono" color={colors.textDense}>
            {distance}
          </Text>
        </View>
        <Text variant="mono" color={colors.accentLight} style={{ textTransform: 'none' }}>
          {note}
        </Text>
      </View>
    </View>
  );
}

// Aperçu visuel de la « feuille de route » générée par IA — hors périmètre
// V1 documenté (voir CLAUDE.md) : distances, dénivelé, courbure, photos et
// waypoints sont tous des exemples, rien n'est calculé. Le CTA final pointe
// vers l'écran de guidage (lui-même un aperçu) pour donner une idée du
// parcours complet, sans rien déclencher de réel.
export function AiRoutePreviewScreen(): React.JSX.Element {
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
          <Text variant="title" style={{ fontSize: 20, fontWeight: '600' }}>
            Aperçu itinéraire IA
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

      <View style={styles.body}>
        <View style={styles.mapArea}>
          <View style={styles.mapPlaceholder}>
            <MaterialCommunityIcons name="map-outline" size={32} color={colors.textDense} />
            <Text variant="label" color={colors.textDense}>
              Carte du tracé généré
            </Text>
          </View>
          <View style={styles.mapOverlayTop}>
            <View style={styles.pulseBadge}>
              <View style={styles.pulseDot} />
              <Text variant="mono" color={colors.textPrimary}>
                IA 1.2s · hors-ligne 24 Mo
              </Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Centrer la carte" style={styles.centerMapButton}>
              <MaterialCommunityIcons name="crosshairs-gps" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>
          <View style={styles.routePreviewTag}>
            <View style={styles.routePreviewLeft}>
              <MaterialCommunityIcons name="routes" size={20} color={colors.textPrimary} />
              <View>
                <Text variant="body" style={{ fontSize: 16, fontWeight: '600' }}>
                  Boucle optimisée virages
                </Text>
                <Text variant="mono" color={colors.textDense}>
                  Vercors sauvage · 5 étapes validées
                </Text>
              </View>
            </View>
            <Text variant="monoBold" color={colors.accent}>
              {'100%\nGOUDRON'}
            </Text>
          </View>
        </View>

        <MockBanner message="Aperçu — génération d'itinéraire par IA hors périmètre V1, pas construite." />

        <View style={styles.titleBlock}>
          <View style={styles.recommendedBadge}>
            <View style={styles.recommendedPill}>
              <Text variant="monoBold" color={colors.onAccentLight}>
                RECOMMANDÉ
              </Text>
            </View>
            <Text variant="mono" color={colors.textDense}>
              Génération #408
            </Text>
          </View>
          <Text variant="title" style={{ fontSize: 24, fontWeight: '700' }}>
            Boucle IA : Les Balcons du Vercors & Combe Laval
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard icon="map-marker-distance" label="Distance">
            <View style={styles.metricValueRow}>
              <Text variant="monoBold" tabularNums style={{ fontSize: 28 }}>
                164
              </Text>
              <Text variant="mono" color={colors.textDense}>
                km
              </Text>
            </View>
          </MetricCard>
          <MetricCard icon="clock-outline" label="Temps estimé">
            <View>
              <Text variant="monoBold" tabularNums style={{ fontSize: 28 }}>
                3h15
              </Text>
              <Text variant="mono" color={colors.accentLight} style={{ textTransform: 'none' }}>
                Allure souple
              </Text>
            </View>
          </MetricCard>
          <MetricCard icon="road-variant" label="Indice virages">
            <View>
              <View style={styles.starsRow}>
                {[0, 1, 2, 3, 4].map((index) => (
                  <MaterialCommunityIcons key={index} name="star" size={14} color={colors.accentLight} />
                ))}
              </View>
              <Text variant="mono" color={colors.accentLight} style={{ textTransform: 'none' }}>
                84 lacets serrés
              </Text>
            </View>
          </MetricCard>
          <MetricCard icon="image-filter-hdr" label="Dénivelé">
            <View style={styles.metricValueRow}>
              <Text variant="monoBold" tabularNums style={{ fontSize: 28 }}>
                +1 920
              </Text>
              <Text variant="mono" color={colors.textDense}>
                m
              </Text>
            </View>
          </MetricCard>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartCardHeader}>
            <View style={styles.chartCardHeaderLeft}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={18} color={colors.textPrimary} />
              <Text variant="body" style={{ fontSize: 16, fontWeight: '600' }}>
                Courbure & dénivelé
              </Text>
            </View>
            <Text variant="mono" color={colors.textDense}>
              Profil altimétrique
            </Text>
          </View>
          <View style={styles.chartPlaceholder}>
            <MaterialCommunityIcons name="chart-timeline-variant" size={24} color={colors.textDense} />
          </View>
          <View style={styles.chartAxisRow}>
            <Text variant="mono" color={colors.textDense}>
              0 km (240m)
            </Text>
            <Text variant="monoBold" color={colors.accent}>
              Col 1069m
            </Text>
            <Text variant="mono" color={colors.textDense}>
              164 km (240m)
            </Text>
          </View>
          <View style={styles.highlightBadges}>
            <View style={styles.highlightBadge}>
              <MaterialCommunityIcons name="road" size={16} color={colors.textPrimary} />
              <Text variant="mono" color={colors.textPrimary} style={{ textTransform: 'none' }}>
                92% asphalte parfait
              </Text>
            </View>
            <View style={styles.highlightBadge}>
              <MaterialCommunityIcons name="highway" size={14} color={colors.textPrimary} />
              <Text variant="mono" color={colors.textPrimary} style={{ textTransform: 'none' }}>
                0 péage / 0 autoroute
              </Text>
            </View>
            <View style={styles.highlightBadge}>
              <MaterialCommunityIcons name="image-filter-hdr" size={14} color={colors.textPrimary} />
              <Text variant="mono" color={colors.textPrimary} style={{ textTransform: 'none' }}>
                2 cols ouverts
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.gallerySection}>
          <Text variant="mono" color={colors.textDense}>
            Aperçu visuel des segments
          </Text>
          <View style={styles.galleryRow}>
            <View style={styles.galleryTile}>
              <MaterialCommunityIcons
                name="image-multiple-outline"
                size={20}
                color={colors.textDense}
                style={{ position: 'absolute', top: 12, left: 12 }}
              />
              <Text variant="monoBold" color={colors.textPrimary}>
                Gorges du Nan
              </Text>
            </View>
            <View style={styles.galleryTile}>
              <MaterialCommunityIcons
                name="image-multiple-outline"
                size={20}
                color={colors.textDense}
                style={{ position: 'absolute', top: 12, left: 12 }}
              />
              <Text variant="monoBold" color={colors.textPrimary}>
                Col de Romeyère
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.roadbookCard}>
          <View style={styles.roadbookHeader}>
            <Text variant="body" style={{ fontSize: 16, fontWeight: '700', textTransform: 'uppercase' }}>
              Feuille de route IA
            </Text>
            <Text variant="mono" color={colors.textDense}>
              5 waypoints
            </Text>
          </View>

          <Waypoint icon="gas-station-outline" title="Départ : Grenoble Sud" distance="0 km" note="Plein carburant recommandé" />
          <Waypoint icon="image-filter-vintage" title="Gorges du Nan" distance="km 42" note="Route taillée dans la falaise · vue falaise" />
          <Waypoint icon="image-filter-hdr" title="Col de Romeyère" distance="km 78" note="Altitude 1 069 m · goudron neuf" />
          <Waypoint icon="camera-outline" title="Le Belvédère Motard" distance="km 112" note="Pause suggérée · parking moto dédié" />
          <Waypoint icon="flag-checkered" title="Arrivée : Grenoble Sud" distance="km 164" note="Fin de la boucle" isLast isEnd />
        </View>

        <View style={styles.secondaryActionsRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Générer une variante IA" style={styles.secondaryAction}>
            <MaterialCommunityIcons name="swap-horizontal" size={20} color={colors.textPrimary} />
            <Text variant="body" style={{ fontSize: 16, fontWeight: '600' }}>
              Variante IA
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Ajuster le nombre de virages" style={styles.secondaryAction}>
            <MaterialCommunityIcons name="tune-variant" size={18} color={colors.textPrimary} />
            <Text variant="body" style={{ fontSize: 16, fontWeight: '600' }}>
              Virages ±
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lancer le guidage"
          onPress={() => {
            router.push('/guidance');
          }}
          style={styles.primaryCta}
        >
          <View style={styles.primaryCtaLeft}>
            <MaterialCommunityIcons name="play-circle-outline" size={28} color={colors.onAccentLight} />
            <View>
              <Text
                variant="title"
                color={colors.onAccentLight}
                style={{ fontSize: 20, fontWeight: '800', textTransform: 'uppercase' }}
              >
                {'Lancer le\nguidage'}
              </Text>
              <Text variant="mono" color={colors.onAccentLight} style={{ textTransform: 'none' }}>
                Mode hors-ligne · audio casque actif
              </Text>
            </View>
          </View>
          <Text variant="monoBold" color={colors.onAccentLight} style={{ fontSize: 18, textAlign: 'center' }}>
            {'164\nKM'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
