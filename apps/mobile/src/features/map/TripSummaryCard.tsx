import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AddressSuggestionDto, RouteGeometryDto } from '@roadtalk/contracts';
import type React from 'react';
import { useRef, useState } from 'react';
import type { LayoutAnimationConfig, LayoutChangeEvent } from 'react-native';
import { Animated, LayoutAnimation, PanResponder, Pressable, View } from 'react-native';

import { colors, Text } from '../../ui';
import { formatArrivalTime, formatDistanceKm, formatDuration } from '../routing/format';
import { ReorderableStepRow } from './ReorderableStepRow';
import { styles } from './TripSummaryCard.styles';

const ICON_SIZE = 18;
const START_ICON_SIZE = 18;
// Distance de glissement (px) pour une transition complète ouvert ↔ réduit.
const DRAG_RANGE = 140;
// Vitesse de relâchement (px/ms) au-delà de laquelle un geste franc (flick)
// décide seul, sans regarder la distance parcourue.
const FLICK_VELOCITY = 0.8;
// Agrandit la zone tactile de la poignée sans toucher à son apparence (le
// trait visible reste minuscule) — purement pour la fiabilité au doigt.
const GRIP_HIT_SLOP = { top: 20, bottom: 20, left: 32, right: 32 };

// Config personnalisée plutôt que Presets.easeInEaseOut (trop plate) ou
// Presets.spring (trop lent/rebondissant, 700ms) : un ressort ferme et bref,
// plus proche de la sensation d'une feuille iOS native. Utilisée pour le
// changement de hauteur qui règle l'animation de glissement (voir plus bas).
const COLLAPSE_ANIMATION: LayoutAnimationConfig = {
  duration: 320,
  create: { type: LayoutAnimation.Types.easeOut, property: LayoutAnimation.Properties.opacity },
  update: { type: LayoutAnimation.Types.spring, springDamping: 0.8 },
  delete: { type: LayoutAnimation.Types.easeOut, property: LayoutAnimation.Properties.opacity },
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

interface Props {
  // Dans l'ordre de visite — jamais vide quand ce composant est rendu,
  // l'écran parent ne le monte pas sinon.
  readonly stops: readonly AddressSuggestionDto[];
  readonly route: RouteGeometryDto | undefined;
  readonly isComputing: boolean;
  readonly error: string | undefined;
  readonly onRemoveStop: (index: number) => void;
  // Permute deux étapes intermédiaires (jamais le terminus, toujours fixe en
  // dernière position) — voir ReorderableStepRow.
  readonly onReorderStop: (fromIndex: number, toIndex: number) => void;
  // Clé = identité de l'arrêt (label+coords, voir ReorderableStepRow), pas
  // son index : la catégorie doit suivre l'arrêt quand on le réordonne.
  readonly stopTags: ReadonlyMap<string, string>;
  readonly onSetStopTag: (stop: AddressSuggestionDto, tag: string | undefined) => void;
  // Focus la barre de recherche (voir MapScreen, searchInputRef) — pas de
  // sélecteur dédié, ajouter un arrêt passe toujours par la recherche.
  readonly onAddStop: () => void;
  readonly onStart: () => void;
  // Sauvegarde l'itinéraire planifié (pas encore roulé) — distinct de
  // "Sauvegarder dans l'historique" sur RideSummaryScreen, qui sauvegarde
  // une trace GPS réelle une fois la balade terminée.
  readonly onSaveRoute: () => void;
  readonly isSavingRoute: boolean;
  readonly isRouteSaved: boolean;
  readonly onLayout: (event: LayoutChangeEvent) => void;
}

export function stopKey(stop: AddressSuggestionDto): string {
  return `${stop.label}-${String(stop.latitude)}-${String(stop.longitude)}`;
}

// Écran de préparation, pas de guidage (DA section 8) : la feuille de route
// complète avant de rouler — pas les 3 infos du mode guidage, un contexte
// différent avec des besoins différents.
export function TripSummaryCard({
  stops,
  route,
  isComputing,
  error,
  onRemoveStop,
  onReorderStop,
  stopTags,
  onSetStopTag,
  onAddStop,
  onStart,
  onSaveRoute,
  isSavingRoute,
  isRouteSaved,
  onLayout,
}: Props): React.JSX.Element {
  // +1 : la position de départ compte comme premier jalon, bien qu'elle ne
  // fasse jamais partie de `stops` (voir MapScreen).
  const waypointCount = stops.length + 1;
  const [isCollapsed, setIsCollapsed] = useState(false);
  // true seulement pendant un geste de glissement actif (doigt posé) — en
  // dehors de ça, un seul des deux contenus (complet ou réduit) est monté,
  // ce qui permet à la carte de retrouver une vraie hauteur compacte une
  // fois réduite plutôt qu'un simple habillage visuel par transform.
  const [isDragging, setIsDragging] = useState(false);
  // Miroir de isCollapsed lisible depuis les gestionnaires du PanResponder
  // (créé une seule fois, voir plus bas) sans jamais fermer sur une valeur
  // figée d'un rendu passé.
  const isCollapsedRef = useRef(isCollapsed);
  isCollapsedRef.current = isCollapsed;
  // 0 = ouvert, 1 = réduit. Piloté à la main pendant le drag (setValue),
  // puis relâché à un ressort (Animated.spring) une fois le doigt levé.
  // JS-driven (pas useNativeDriver) : pilote `height`, propriété de layout
  // que le driver natif ne sait pas animer.
  const dragProgress = useRef(new Animated.Value(isCollapsed ? 1 : 0)).current;
  const startProgressRef = useRef(0);
  // Hauteur du contenu complet, mesurée à chaque rendu au repos.
  const expandedHeightRef = useRef(0);
  // Hauteur de la barre réduite, mesurée via la sonde invisible ci-dessous
  // (toujours montée) — nécessaire dès le tout premier glissement, avant
  // même que l'utilisateur n'ait jamais réduit la feuille une première fois.
  const collapsedHeightRef = useRef(0);

  const commit = (collapsed: boolean): void => {
    if (collapsed !== isCollapsedRef.current) {
      LayoutAnimation.configureNext(COLLAPSE_ANIMATION);
      setIsCollapsed(collapsed);
    }
  };

  // Pas de react-native-gesture-handler dans le projet (module natif — voir
  // l'incident de build du GPX export, même cause) : PanResponder, intégré à
  // React Native, suffit pour suivre un glissement vertical au doigt.
  //
  // Créé une seule fois (useRef, pas à chaque rendu) : le recréer en plein
  // geste — ce qui arrivait avant, un rendu étant déclenché à chaque frame
  // par le onLayout remonté au parent pendant le drag — pouvait faire perdre
  // le responder en cours de route (tremblement, geste qui n'aboutit jamais).
  // Les gestionnaires ci-dessous ne lisent donc que des refs/setters stables,
  // jamais une valeur de rendu fermée.
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gestureState) =>
        Math.abs(gestureState.dy) > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderGrant: () => {
        startProgressRef.current = isCollapsedRef.current ? 1 : 0;
        dragProgress.stopAnimation();
        setIsDragging(true);
      },
      onPanResponderMove: (_event, gestureState) => {
        dragProgress.setValue(clamp01(startProgressRef.current + gestureState.dy / DRAG_RANGE));
      },
      onPanResponderRelease: (_event, gestureState) => {
        const distanceProgress = clamp01(startProgressRef.current + gestureState.dy / DRAG_RANGE);
        let shouldCollapse: boolean;
        if (gestureState.vy > FLICK_VELOCITY) {
          shouldCollapse = true;
        } else if (gestureState.vy < -FLICK_VELOCITY) {
          shouldCollapse = false;
        } else {
          shouldCollapse = distanceProgress > 0.5;
        }

        Animated.spring(dragProgress, {
          toValue: shouldCollapse ? 1 : 0,
          useNativeDriver: false,
          damping: 18,
          mass: 0.6,
          stiffness: 180,
        }).start(() => {
          setIsDragging(false);
          commit(shouldCollapse);
        });
      },
    }),
  ).current;

  const animatedHeight = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [expandedHeightRef.current || 1, collapsedHeightRef.current || 1],
  });

  const collapsedSummary = (
    <>
      <MaterialCommunityIcons name="routes" size={18} color={colors.textPrimary} />
      <Text variant="mono" color={colors.textDense} numberOfLines={1} style={styles.collapsedLabel}>
        {waypointCount} {waypointCount > 1 ? 'jalons' : 'jalon'}
        {route !== undefined
          ? ` · ${formatDistanceKm(route.distanceMeters)} · ${formatDuration(route.durationSeconds)}`
          : ''}
      </Text>
      <MaterialCommunityIcons name="chevron-up" size={20} color={colors.textSecondary} />
    </>
  );

  const fullContent = (
    <>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <MaterialCommunityIcons name="routes" size={18} color={colors.textPrimary} />
          <Text variant="title" style={styles.headerTitleText}>
            Feuille de route
          </Text>
        </View>
        <View style={styles.jalonsBadge}>
          <Text variant="mono" color={colors.textDense}>
            {waypointCount} {waypointCount > 1 ? 'jalons' : 'jalon'}
          </Text>
        </View>
      </View>

      <View style={styles.stepsList}>
        <View style={styles.stepRow}>
          <View style={[styles.stepBadge, styles.originBadge]}>
            <Text variant="monoBold" color={colors.accentLight}>
              D
            </Text>
          </View>
          <View style={styles.stepTexts}>
            <Text variant="mono" color={colors.textDense} style={styles.stepLabel}>
              Départ immédiat
            </Text>
            {/* Pas de géocodage inverse de la position de l'utilisateur
                lui-même (coûteux, jamais utilisé ailleurs) : un libellé
                générique plutôt qu'une fausse adresse précise. */}
            <Text variant="body" numberOfLines={1} style={styles.stepAddress}>
              Position actuelle
            </Text>
          </View>
        </View>

        {stops.map((stop, index) => {
          const isLast = index === stops.length - 1;

          // Terminus : toujours fixe en dernière position, pas de glisser-
          // déposer ni de catégorie (c'est la destination, pas une étape).
          if (isLast) {
            return (
              <View
                key={`${String(index)}-${stop.label}-${String(stop.latitude)}-${String(stop.longitude)}`}
                style={styles.stepRow}
              >
                <View style={[styles.stepBadge, styles.terminusBadge]}>
                  <Text variant="monoBold" color={colors.onAccentLight}>
                    A
                  </Text>
                </View>
                <View style={styles.stepTexts}>
                  <Text variant="mono" color={colors.textDense} style={styles.stepLabel}>
                    Terminus
                  </Text>
                  <Text variant="body" numberOfLines={1} style={styles.stepAddress}>
                    {stop.label}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    onRemoveStop(index);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Retirer l'arrêt ${stop.label}`}
                  style={styles.closeButton}
                >
                  <MaterialCommunityIcons name="close" size={ICON_SIZE} color={colors.textSecondary} />
                </Pressable>
              </View>
            );
          }

          return (
            <ReorderableStepRow
              // index en tête : deux arrêts peuvent légitimement partager la
              // même adresse (ex. boucle qui repasse par le même point) —
              // seul l'index garantit l'unicité, label/coords ne servent
              // qu'à la lisibilité en cas d'inspection.
              key={`${String(index)}-${stop.label}-${String(stop.latitude)}-${String(stop.longitude)}`}
              index={index}
              count={stops.length - 1}
              stop={stop}
              tag={stopTags.get(stopKey(stop))}
              onRemove={() => {
                onRemoveStop(index);
              }}
              onReorder={onReorderStop}
              onSetTag={(tag) => {
                onSetStopTag(stop, tag);
              }}
            />
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajouter un arrêt"
          onPress={onAddStop}
          style={({ pressed }) => [styles.addStopButton, pressed ? styles.addStopButtonPressed : null]}
        >
          <MaterialCommunityIcons name="map-marker-plus-outline" size={ICON_SIZE} color={colors.textPrimary} />
          <Text variant="monoBold" color={colors.textPrimary}>
            Ajouter un arrêt
          </Text>
        </Pressable>
      </View>

      {error !== undefined ? (
        <Text variant="body" color={colors.danger} style={styles.message}>
          {error}
        </Text>
      ) : null}

      {error === undefined && (isComputing || route === undefined) ? (
        <Text variant="body" color={colors.textSecondary} style={styles.message}>
          Calcul de l'itinéraire…
        </Text>
      ) : null}

      {error === undefined && route !== undefined ? (
        <View style={styles.stats}>
          <Stat value={formatDistanceKm(route.distanceMeters)} caption="Distance" />
          <Stat value={formatDuration(route.durationSeconds)} caption="Durée estimée" />
          <Stat value={formatArrivalTime(route.durationSeconds)} caption="Arrivée" />
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isRouteSaved ? 'Itinéraire déjà enregistré' : 'Enregistrer le trip'}
          accessibilityState={{ disabled: route === undefined || isSavingRoute || isRouteSaved }}
          disabled={route === undefined || isSavingRoute || isRouteSaved}
          onPress={onSaveRoute}
          style={({ pressed }) => [
            styles.saveRouteButton,
            route === undefined || isSavingRoute || isRouteSaved ? styles.startButtonDisabled : null,
            pressed ? styles.startButtonPressed : null,
          ]}
        >
          <MaterialCommunityIcons
            name={isRouteSaved ? 'check-circle-outline' : 'content-save-outline'}
            size={START_ICON_SIZE}
            color={colors.textPrimary}
          />
          <Text variant="label" color={colors.textPrimary} style={styles.saveRouteButtonLabel}>
            {isRouteSaved ? 'Enregistré' : 'Enregistrer'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Démarrer le guidage"
          accessibilityState={{ disabled: route === undefined }}
          disabled={route === undefined}
          onPress={onStart}
          style={({ pressed }) => [
            styles.startButton,
            route === undefined ? styles.startButtonDisabled : null,
            pressed ? styles.startButtonPressed : null,
          ]}
        >
          <Text variant="title" color={colors.onAccentLight} style={styles.startButtonLabel}>
            Démarrer
          </Text>
          <MaterialCommunityIcons name="navigation-variant" size={START_ICON_SIZE} color={colors.onAccentLight} />
        </Pressable>
      </View>
    </>
  );

  return (
    <View style={styles.card} onLayout={isDragging ? undefined : onLayout}>
      <View
        style={styles.gripHandle}
        hitSlop={GRIP_HIT_SLOP}
        {...panResponder.panHandlers}
      >
        <View style={styles.grip} />
      </View>

      {/* Sonde invisible, toujours montée : connaît la hauteur réduite avant
          même que l'utilisateur n'ait jamais réduit la feuille une première
          fois (nécessaire pour interpoler `animatedHeight` dès le premier
          glissement). */}
      <View
        style={styles.measureProbe}
        pointerEvents="none"
        onLayout={(event) => {
          collapsedHeightRef.current = event.nativeEvent.layout.height;
        }}
      >
        <View style={styles.collapsedRow}>{collapsedSummary}</View>
      </View>

      {isDragging ? (
        // La div elle-même rétrécit (hauteur animée), pas juste son contenu
        // en transparence : le contenu complet est coupé par le bas au fur
        // et à mesure (overflow hidden), jusqu'à ne plus laisser voir que la
        // poignée et la sonde au-dessus.
        <Animated.View style={[styles.dragBody, { height: animatedHeight }]}>{fullContent}</Animated.View>
      ) : isCollapsed ? (
        // panHandlers sur tout le bandeau réduit, pas seulement la poignée
        // au-dessus : une fois réduite, la barre est fine et un swipe
        // démarré sur son bord gauche/droit (hors de la poignée) doit quand
        // même pouvoir la rouvrir. Le tap simple (sans glissement) passe
        // toujours au Pressable en dessous, inchangé.
        <View {...panResponder.panHandlers}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Afficher la feuille de route"
            onPress={() => {
              commit(false);
            }}
            style={styles.collapsedRow}
          >
            {collapsedSummary}
          </Pressable>
        </View>
      ) : (
        <View
          onLayout={(event) => {
            expandedHeightRef.current = event.nativeEvent.layout.height;
          }}
        >
          {fullContent}
        </View>
      )}
    </View>
  );
}

interface StatProps {
  readonly value: string;
  readonly caption: string;
}

function Stat({ value, caption }: StatProps): React.JSX.Element {
  return (
    <View style={styles.stat}>
      <Text variant="monoBold" color={colors.textPrimary} style={styles.statValue}>
        {value}
      </Text>
      <Text variant="mono" color={colors.textDense}>
        {caption}
      </Text>
    </View>
  );
}
