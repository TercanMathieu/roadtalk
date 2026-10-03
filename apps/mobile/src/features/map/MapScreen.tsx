import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Camera,
  type CameraRef,
  LogManager,
  Map,
  type PressEvent,
  type StyleSpecification,
  type TrackUserLocation,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import type { AddressSuggestionDto } from '@roadtalk/contracts';
import { useFocusEffect, useNavigation } from 'expo-router';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, NativeSyntheticEvent } from 'react-native';
import { Alert, Keyboard, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLastKnownPosition } from '../../lib/useLastKnownPosition';
import { colors, Snackbar, spacing, TAB_BAR_STYLE, Text, useSnackbar } from '../../ui';
import { withFreshAccessToken } from '../auth/auth.store';
import { DirectionsSheet } from '../guidance/DirectionsSheet';
import { GuidanceFooter } from '../guidance/GuidanceFooter';
import { type GuidanceStatus, ManeuverBanner } from '../guidance/ManeuverBanner';
import { ManeuverMarker } from '../guidance/ManeuverMarker';
import { OFF_ROUTE_THRESHOLD_METERS } from '../guidance/route-progress';
import { useManeuverSteps, useRouteProgress } from '../guidance/useRouteProgress';
import { stopBackgroundRecording } from '../ride-summary/background-recording';
import { discardJournal, readJournal } from '../ride-summary/ride-journal';
import { RideSummaryScreen } from '../ride-summary/RideSummaryScreen';
import { type RideSummary, summarizeTrack } from '../ride-summary/summarize-track';
import type { TrackPoint } from '../ride-summary/track-point';
import { useTrackRecording } from '../ride-summary/useTrackRecording';
import { useRoute } from '../routing/useRoute';
import { saveRoute } from '../saved-routes/api';
import { usePendingRouteLaunchStore } from '../saved-routes/pendingRouteLaunch.store';
import { AddressSearchBar } from '../search/AddressSearchBar';
import { reverseGeocode } from '../search/api';
import { useSettingsStore } from '../settings/settings.store';
import { useAppHeaderStore } from './appHeader.store';
import { APP_HEADER_HEIGHT } from './AppHeader.styles';
import { GuidanceMapButton } from './GuidanceMapButton';
import { HeadingBadge } from './HeadingBadge';
import { loadNavigationMapStyle } from './loadMapStyle';
import {
  DEFAULT_CENTER_COORDINATES,
  DEFAULT_PITCH_DEGREES,
  DEFAULT_ZOOM_LEVEL,
  GUIDANCE_PITCH_DEGREES,
  GUIDANCE_ZOOM_LEVEL,
  MAP_STYLE_URL,
} from './map.config';
import { MapModeButton } from './MapModeButton';
import { styles } from './MapScreen.styles';
import { RecenterButton } from './RecenterButton';
import { MAP_OVERLAY_BUTTON_SIZE } from './RecenterButton.styles';
import { RouteLine } from './RouteLine';
import { RouteStatusChips } from './RouteStatusChips';
import { StopMarkers } from './StopMarkers';
import { stopKey, TripSummaryCard } from './TripSummaryCard';
import { useUserLocationPermission } from './useUserLocationPermission';
import { useVehiclePosition } from './useVehiclePosition';
import { VehicleMarker } from './VehicleMarker';

const FLY_TO_DURATION_MS = 1200;

// Rayon d'arrivée : en dessous, la précision GPS elle-même (quelques mètres)
// rend la distinction "pas encore arrivé" / "arrivé" peu fiable de toute
// façon — pas d'intérêt à viser plus précis.
const ARRIVAL_THRESHOLD_METERS = 20;
const ALERT_DISMISS_DELAY_MS = 400;
// Recalcul hors itinéraire — voir l'effet correspondant dans MapScreen.
const REROUTE_DELAY_MS = 4000;
const REROUTE_COOLDOWN_MS = 15000;
// Même seuil que la fiabilité du cap (useVehiclePosition) : en dessous, la
// moto est considérée à l'arrêt.
const REROUTE_MIN_SPEED_MPS = 1.39;

// Même arrondi que le libellé de repli du backend (search.service.ts) : un
// arrêt ajouté par appui long s'affiche avec ce libellé immédiatement, avant
// même de savoir si le géocodage inverse trouvera un nom de lieu.
const PLACEHOLDER_LABEL_DECIMALS = 4;

const MAP_MODE_UNAVAILABLE_MESSAGE = 'Mode 3D bientôt disponible.';
const ROUTE_SAVED_MESSAGE = 'Itinéraire enregistré.';
const ROUTE_SAVE_FAILED_MESSAGE = "L'enregistrement de l'itinéraire a échoué.";
// Hauteur de la barre de recherche (bar.minHeight) : la ligne de puces
// (RouteStatusChips) se positionne juste en dessous, sans dépendre d'une
// mesure de layout.
const SEARCH_BAR_HEIGHT = 48;

// Hissé hors du composant : une identité stable évite de re-notifier la vue
// native à chaque rendu pour une valeur qui, elle, ne change jamais.
const INITIAL_VIEW_STATE = {
  center: DEFAULT_CENTER_COORDINATES,
  zoom: DEFAULT_ZOOM_LEVEL,
  pitch: DEFAULT_PITCH_DEGREES,
} as const;

// MapLibre est bavard au niveau "warn" (avertissements de style à chaque
// chargement) et chacun de ces messages transite par `console.warn`, donc par
// le pont de logs d'Expo — dont la construction de pile plante sur cette
// version. Filtrer au niveau natif tarit la source sans masquer les vraies
// erreurs, qui continuent de remonter.
LogManager.setLogLevel('error');

// Deux modes d'écran radicalement différents (DA section 8) : préparation
// (vue d'ensemble, recentrage "default" qui ne fait pas tourner la carte
// selon le cap) et guidage turn-by-turn (caméra "course", 3 infos max,
// aucune exploration manuelle de la carte — C2).
export function MapScreen(): React.JSX.Element {
  const [mapStyle, setMapStyle] = useState<string | StyleSpecification>(MAP_STYLE_URL);
  // Vrai une fois que `mapStyle` a atteint sa valeur finale (succès ou échec
  // du chargement filtré) — jamais avant. Un remplacement de style en cours
  // de vie du composant recharge le style natif en entier
  // (MLRNMapView.setReactMapStyle : removeAllSourcesFromMap puis
  // addAllSourcesToMap) ; une image enregistrée via <Images> avant ce
  // remplacement (VehicleMarker) n'est pas garantie de survivre au
  // rechargement. Retarder le montage des calques custom jusqu'à ce que le
  // style ne bouge plus plutôt que de compter sur une éventuelle
  // récupération native après coup.
  const [isStyleReady, setIsStyleReady] = useState(false);
  // Dans l'ordre de visite. La position de l'utilisateur (originRef) sert
  // toujours de premier point du trajet — elle ne fait jamais partie de cette
  // liste, qui ne contient que les arrêts choisis.
  const [stops, setStops] = useState<readonly AddressSuggestionDto[]>([]);
  // Catégorie choisie par l'utilisateur pour une étape (voir ReorderableStepRow)
  // — jamais déduite ou devinée, clé = identité de l'arrêt pour suivre un
  // réordonnement.
  const [stopTags, setStopTags] = useState<ReadonlyMap<string, string>>(new globalThis.Map());
  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const [isRouteSaved, setIsRouteSaved] = useState(false);
  // Toute modification des arrêts invalide la sauvegarde précédente : ce
  // n'est plus le même itinéraire.
  useEffect(() => {
    setIsRouteSaved(false);
  }, [stops]);
  const [isFollowing, setIsFollowing] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isDirectionsExpanded, setIsDirectionsExpanded] = useState(false);
  // Reflète le panneau de la barre de recherche (résultats/historique), voir
  // AddressSearchBar.onPanelVisibleChange — pilote l'overlay de fermeture.
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [rideSummary, setRideSummary] = useState<
    | { readonly rideId: string; readonly summary: RideSummary; readonly points: readonly TrackPoint[] }
    | undefined
  >(undefined);
  // Hauteur réelle de ManeuverBanner (varie avec le texte de la manœuvre) :
  // positionne le badge de cap et les boutons flottants juste en dessous,
  // jamais en dur — même logique que tripSummaryCardHeight plus bas.
  const [maneuverBannerHeight, setManeuverBannerHeight] = useState(0);
  // Hauteur réelle de TripSummaryCard, mesurée au rendu : sa taille varie
  // selon le nombre d'arrêts et son contenu (chargement, erreur, ou les
  // trois statistiques), donc une valeur fixe aurait soit laissé un vide,
  // soit chevauché le bouton.
  const [tripSummaryCardHeight, setTripSummaryCardHeight] = useState(0);
  const cameraRef = useRef<CameraRef>(null);
  const searchInputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const snackbar = useSnackbar();
  const navigation = useNavigation();
  const permission = useUserLocationPermission();
  // Tenu ici plutôt que dans la barre de recherche : l'identité de la ref est
  // stable, la passer en prop ne provoque aucun rendu supplémentaire.
  const { positionRef: originRef, hasFix: hasGpsFix } = useLastKnownPosition(permission === 'granted');
  const gpsStatus =
    permission === 'denied' ? 'off' : permission === 'checking' ? 'checking' : hasGpsFix ? 'ok' : 'searching';
  const setHeaderVisible = useAppHeaderStore((state) => state.setVisible);
  const setHeaderGpsStatus = useAppHeaderStore((state) => state.setGpsStatus);
  const avoidHighways = useSettingsStore((state) => state.avoidHighways);
  const setAvoidHighways = useSettingsStore((state) => state.setAvoidHighways);
  const voiceEnabled = useSettingsStore((state) => state.voiceEnabled);
  const setVoiceEnabled = useSettingsStore((state) => state.setVoiceEnabled);
  // Incrémenté pour redemander un tracé depuis la position actuelle (voir
  // l'effet de recalcul hors itinéraire plus bas, et useRoute).
  const [rerouteToken, setRerouteToken] = useState(0);
  const offRouteSinceRef = useRef<number | undefined>(undefined);
  const lastRerouteAtRef = useRef(0);
  const { route, isComputing: isComputingRoute, error: routeError } = useRoute(
    stops,
    originRef,
    hasGpsFix,
    avoidHighways,
    rerouteToken,
  );
  // Deuxième souscription à la même position (VehicleMarker en tient déjà
  // une) : réutilise le flux natif partagé avec <Camera trackUserLocation>
  // (voir useVehiclePosition), donc aucun capteur GPS supplémentaire — juste
  // un second écouteur JS, négligeable comparé à refactorer VehicleMarker
  // pour faire remonter sa position en prop.
  const vehiclePosition = useVehiclePosition();
  const progress = useRouteProgress(route, vehiclePosition?.latitude, vehiclePosition?.longitude);
  const maneuverSteps = useManeuverSteps(route);
  // Accumule le tracé réel pendant le guidage, à partir du même flux de
  // position (aucune souscription GPS supplémentaire, C1) — sert au résumé
  // de balade affiché à la sortie du guidage.
  const trackRecording = useTrackRecording(vehiclePosition, isNavigating);

  // La barre d'onglets (Carte/Historique/Réglages) n'a aucun sens pendant le
  // guidage actif — passer à un autre onglet interromprait la navigation en
  // cours. La masquer libère aussi l'espace qu'elle occupait sous le bandeau
  // cockpit, qui créait un double bandeau noir en bas de l'écran.
  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: isNavigating ? { ...TAB_BAR_STYLE, display: 'none' } : TAB_BAR_STYLE,
    });
  }, [isNavigating, navigation]);

  // AppHeader est désormais rendu une seule fois par le layout des onglets
  // (commun aux trois), pas ici — cette carte reste la seule à connaître le
  // statut GPS réel et si le guidage actif doit le masquer, relayés via le
  // store plutôt que par un rendu local.
  useEffect(() => {
    setHeaderVisible(!isNavigating);
    setHeaderGpsStatus(gpsStatus);
  }, [isNavigating, gpsStatus, setHeaderVisible, setHeaderGpsStatus]);

  useEffect(() => {
    let cancelled = false;

    loadNavigationMapStyle()
      .then((filtered) => {
        if (!cancelled) {
          setMapStyle(filtered);
        }
      })
      .catch(() => {
        // Le style brut (MAP_STYLE_URL) reste affiché en repli — carte
        // fonctionnelle mais avec les POI, plutôt qu'un écran vide.
      })
      .finally(() => {
        // Succès ou échec : `mapStyle` ne changera plus après ça.
        if (!cancelled) {
          setIsStyleReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Ajoute toujours un arrêt plutôt que de remplacer la destination
  // existante : un premier choix devient ainsi naturellement le premier
  // arrêt, sans cas particulier à gérer pour distinguer "première sélection"
  // et "arrêt supplémentaire".
  const handleAddStop = (suggestion: AddressSuggestionDto): void => {
    const lastStop = stops[stops.length - 1];
    // Même adresse que le dernier arrêt = segment de longueur nulle, sans
    // intérêt pour un trajet (vérifié auprès de Valhalla : il l'accepte sans
    // erreur, mais produit une étape à 0 km). Comparé sur les coordonnées,
    // pas le libellé — deux résultats de recherche au même endroit mais
    // formulés différemment désignent quand même le même point. Un
    // aller-retour (A → B → A) reste autorisé : seul le doublon consécutif
    // est bloqué.
    if (lastStop?.latitude === suggestion.latitude && lastStop.longitude === suggestion.longitude) {
      return;
    }

    setStops((previous) => [...previous, suggestion]);
    // Relâche le suivi : sinon la caméra ramènerait aussitôt la vue sur
    // l'utilisateur, rendant l'arrêt impossible à regarder.
    setIsFollowing(false);
    // Déplacement impératif plutôt qu'une prop contrôlée : la caméra ne doit
    // bouger qu'à la sélection, sinon chaque rendu ramènerait la vue de force
    // et empêcherait de se déplacer à la main.
    cameraRef.current?.flyTo({
      center: [suggestion.longitude, suggestion.latitude],
      zoom: DEFAULT_ZOOM_LEVEL,
      duration: FLY_TO_DURATION_MS,
    });
  };

  const handleRemoveStop = (index: number): void => {
    setStops((previous) => previous.filter((_stop, i) => i !== index));
    setStopTags((previous) => {
      const stop = stops[index];
      if (stop === undefined) {
        return previous;
      }
      const next = new globalThis.Map(previous);
      next.delete(stopKey(stop));
      return next;
    });
  };

  const handleReorderStop = (fromIndex: number, toIndex: number): void => {
    setStops((previous) => {
      const next = [...previous];
      const [moved] = next.splice(fromIndex, 1);
      if (moved === undefined) {
        return previous;
      }
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleSetStopTag = (stop: AddressSuggestionDto, tag: string | undefined): void => {
    setStopTags((previous) => {
      const next = new globalThis.Map(previous);
      if (tag === undefined) {
        next.delete(stopKey(stop));
      } else {
        next.set(stopKey(stop), tag);
      }
      return next;
    });
  };

  // Sauvegarde l'itinéraire planifié (liste d'arrêts), pas une trace GPS —
  // distinct de la sauvegarde de balade (RideSummaryScreen), qui n'existe
  // qu'une fois la route effectivement roulée.
  const handleSaveRoute = (): void => {
    const origin = originRef.current;
    if (origin === undefined || route === undefined) {
      return;
    }

    setIsSavingRoute(true);
    withFreshAccessToken((accessToken) =>
      saveRoute(accessToken, {
        name: undefined,
        waypoints: [
          { latitude: origin.latitude, longitude: origin.longitude },
          ...stops.map((stop) => ({ latitude: stop.latitude, longitude: stop.longitude })),
        ],
        avoidHighways,
        distanceMeters: route.distanceMeters,
        durationSeconds: route.durationSeconds,
      }),
    )
      .then(() => {
        setIsRouteSaved(true);
        snackbar.show(ROUTE_SAVED_MESSAGE);
      })
      .catch(() => {
        snackbar.show(ROUTE_SAVE_FAILED_MESSAGE);
      })
      .finally(() => {
        setIsSavingRoute(false);
      });
  };

  // Relance d'un itinéraire enregistré depuis l'onglet Balades (voir
  // pendingRouteLaunch.store.ts) : consommé à chaque reprise de focus de cet
  // écran, pas seulement au montage — les onglets restent montés en
  // arrière-plan dans Expo Router, un effet au montage seul ne se
  // redéclencherait pas en revenant sur cet onglet.
  useFocusEffect(
    useCallback(() => {
      const launch = usePendingRouteLaunchStore.getState().consume();
      if (launch === undefined) {
        return;
      }
      setStops(launch.stops);
      setAvoidHighways(launch.avoidHighways);
    }, []),
  );

  // Appui long plutôt qu'un simple tap : un tap seul reste disponible pour
  // interagir avec la carte (sélectionner un marqueur, etc.) sans risquer
  // d'ajouter un arrêt par mégarde en regardant simplement la carte. Un
  // double-tap avait été tenté d'abord, mais MapLibre reconnaît le geste en
  // interne pour son propre zoom au double-tap avant que `onPress` ne soit
  // jamais appelé — même moteur désactivé, le geste ne remonte pas. L'appui
  // long est un geste natif dédié, sans ce conflit.
  //
  // L'arrêt est ajouté tout de suite avec un libellé de repli (coordonnées) :
  // le point et le récapitulatif apparaissent sans attendre le géocodage
  // inverse, qui n'enrichit ensuite que le libellé affiché — jamais
  // nécessaire au calcul de l'itinéraire, qui n'utilise que les coordonnées
  // (voir useRoute, qui ne relance pas le calcul pour cette mise à jour).
  const handleMapLongPress = (event: NativeSyntheticEvent<PressEvent>): void => {
    const [longitude, latitude] = event.nativeEvent.lngLat;

    handleAddStop({
      label: `${latitude.toFixed(PLACEHOLDER_LABEL_DECIMALS)}, ${longitude.toFixed(PLACEHOLDER_LABEL_DECIMALS)}`,
      context: null,
      latitude,
      longitude,
    });

    withFreshAccessToken((accessToken) => reverseGeocode(accessToken, { latitude, longitude }))
      .then((suggestion) => {
        // Retrouvé par les coordonnées exactes de l'appui (pas celles de
        // `suggestion`, potentiellement celles d'un lieu voisin si Photon a
        // trouvé une correspondance) : c'est cet arrêt-là qu'on enrichit.
        setStops((previous) =>
          previous.map((stop) =>
            stop.latitude === latitude && stop.longitude === longitude ? suggestion : stop,
          ),
        );
      })
      .catch(() => {
        // Le libellé de repli reste affiché — même convention que le repli
        // déjà appliqué côté backend quand Photon ne trouve rien : un échec
        // du géocodage inverse n'empêche pas l'arrêt d'exister.
      });
  };

  const handleTripSummaryCardLayout = (event: LayoutChangeEvent): void => {
    setTripSummaryCardHeight(event.nativeEvent.layout.height);
  };

  const handleRecenter = (): void => {
    setIsFollowing(true);

    // Le suivi seul recentrerait déjà, mais seulement au prochain point GPS.
    // Ce déplacement immédiat rend l'appui perceptible tout de suite, et
    // restaure zoom et inclinaison que l'utilisateur a pu modifier à la main.
    const origin = originRef.current;
    if (origin !== undefined) {
      cameraRef.current?.flyTo({
        center: [origin.longitude, origin.latitude],
        zoom: DEFAULT_ZOOM_LEVEL,
        pitch: DEFAULT_PITCH_DEGREES,
        duration: FLY_TO_DURATION_MS,
      });
    }
  };

  // Bascule en mode guidage : caméra "course" (rotation selon le cap de
  // déplacement), UI de préparation masquée au profit de ManeuverBanner et
  // GuidanceFooter. Le déplacement immédiat, comme pour le recentrage, évite
  // d'attendre le prochain point GPS pour voir l'effet de l'appui.
  const handleStart = (): void => {
    setIsNavigating(true);
    setIsFollowing(true);
    // Trajet frais : jamais de points d'une balade précédente mélangés au
    // résumé de celle qui démarre.
    trackRecording.start();

    const origin = vehiclePosition ?? originRef.current;
    if (origin !== undefined) {
      cameraRef.current?.flyTo({
        center: [origin.longitude, origin.latitude],
        zoom: GUIDANCE_ZOOM_LEVEL,
        pitch: GUIDANCE_PITCH_DEGREES,
        duration: FLY_TO_DURATION_MS,
      });
    }
  };

  // Retour à l'écran de préparation : la caméra "course" a pu faire tourner
  // la carte selon le cap — le mode "default" ne rétablit jamais seul une
  // rotation (voir plus bas), donc le cap est explicitement remis à zéro ici.
  const handleExit = (): void => {
    setIsNavigating(false);
    setIsDirectionsExpanded(false);

    // Moins de 2 points : rien d'exploitable (sortie immédiate du guidage) —
    // pas de résumé plutôt qu'un écran de statistiques toutes à zéro.
    // Le journal est complété avant le résumé : il reste sur le disque
    // jusqu'à la sauvegarde ou la fermeture du résumé, pour qu'un arrêt de
    // l'app sur cet écran ne fasse pas perdre la balade.
    const recordedPoints = trackRecording.stop();
    const recordedRideId = trackRecording.getRideId();
    if (recordedPoints.length >= 2 && recordedRideId !== undefined) {
      setRideSummary({ rideId: recordedRideId, summary: summarizeTrack(recordedPoints), points: recordedPoints });
    } else {
      discardJournal();
    }

    const origin = vehiclePosition ?? originRef.current;
    if (origin !== undefined) {
      cameraRef.current?.flyTo({
        center: [origin.longitude, origin.latitude],
        zoom: DEFAULT_ZOOM_LEVEL,
        pitch: DEFAULT_PITCH_DEGREES,
        bearing: 0,
        duration: FLY_TO_DURATION_MS,
      });
    }
  };

  // Arrivée détectée : termine le guidage automatiquement plutôt que
  // d'attendre une action explicite (voir handleExit, qui calcule déjà le
  // résumé et affiche RideSummaryScreen — donc la proposition de sauvegarde
  // dans l'historique dès l'arrivée, sans étape supplémentaire). isNavigating
  // dans la condition suffit à éviter un second déclenchement : handleExit
  // le repasse à false, ce qui désarme l'effet au rendu suivant.
  useEffect(() => {
    if (isNavigating && progress !== undefined && progress.distanceRemaining <= ARRIVAL_THRESHOLD_METERS) {
      handleExit();
    }
  }, [isNavigating, progress]);

  // Balade interrompue : si l'app a été tuée pendant un guidage, son journal
  // est resté sur le disque. Une seule fois au démarrage, on propose d'en
  // voir le résumé (pour la sauvegarder) ou de la supprimer.
  useEffect(() => {
    // Aucun guidage ne peut être en cours à l'ouverture de l'app : une tâche
    // d'arrière-plan encore active est celle de la balade interrompue, que
    // le système aurait relancée. On l'arrête avant de lire le journal.
    stopBackgroundRecording().catch(() => undefined);
    const recovered = readJournal();
    if (recovered === undefined) {
      return;
    }
    if (recovered.points.length < 2) {
      discardJournal();
      return;
    }

    const startedOn = new Date(recovered.header.startedAt).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
    Alert.alert(
      'Balade interrompue',
      `L'app s'est fermée pendant ta balade du ${startedOn}. Son tracé a été retrouvé.`,
      [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: discardJournal },
        {
          text: 'Voir le résumé',
          onPress: () => {
            // Différé : sur iOS, un écran modal présenté pendant que l'alerte
            // se ferme encore est ignoré sans erreur.
            setTimeout(() => {
              setRideSummary({
                rideId: recovered.header.rideId,
                summary: summarizeTrack(recovered.points),
                points: recovered.points,
              });
            }, ALERT_DISMISS_DELAY_MS);
          },
        },
      ],
    );
  }, []);

  // L'utilisateur reprend la main sur la caméra : on lâche le suivi, sinon le
  // prochain point GPS ramènerait la vue et rendrait la carte impossible à
  // explorer.
  //
  // Les deux champs sont nécessaires. `userInteraction` seul ne suffit pas :
  // côté natif il vaut aussi vrai pour une animation déclenchée par le code
  // (CameraChangeTracker.isUserInteraction accepte DEVELOPER_ANIMATION), donc
  // nos propres `flyTo` — dont celui du bouton de recentrage — l'allumeraient
  // et éteindraient le suivi juste après l'avoir armé. `animated` distingue les
  // deux : faux pour un vrai geste, vrai pour une animation programmée.
  //
  // En guidage, ce cas est ignoré : aucune exploration manuelle de la carte
  // pendant qu'on roule (C2) — un geste accidentel ne doit pas décrocher le
  // suivi, le prochain point GPS ramène de toute façon la vue.
  const handleMapMoveStart = (event: NativeSyntheticEvent<ViewStateChangeEvent>): void => {
    if (isNavigating) {
      return;
    }
    if (event.nativeEvent.userInteraction && !event.nativeEvent.animated) {
      setIsFollowing(false);
    }
  };

  const followsUser = permission === 'granted' && isFollowing;
  const trackingMode: TrackUserLocation = isNavigating ? 'course' : 'default';
  // Approximation "corridor 3D" en guidage (voir map.config.ts) : inclinaison
  // maximale MapLibre tant qu'on roule, valeur de préparation sinon —
  // resoumise à chaque point GPS comme le reste de cette prop déclarative.
  const cameraPitch = isNavigating ? GUIDANCE_PITCH_DEGREES : DEFAULT_PITCH_DEGREES;
  const showsTripSummary = stops.length > 0 && permission === 'granted' && !isNavigating;
  // spacing.lg : la marge basse de TripSummaryCard elle-même (voir son style)
  // — le bouton doit franchir toute la hauteur de la carte pour arriver à son
  // sommet, plus un espace pour ne pas coller aux deux.
  const recenterButtonBottom = showsTripSummary
    ? spacing.lg + tripSummaryCardHeight + spacing.sm
    : undefined;
  // Empilé juste au-dessus de RecenterButton, qui bouge lui-même selon la
  // présence de TripSummaryCard.
  const mapModeButtonBottom = (recenterButtonBottom ?? spacing.lg) + MAP_OVERLAY_BUTTON_SIZE + spacing.sm;
  const isOffRoute = progress !== undefined && progress.distanceFromRoute > OFF_ROUTE_THRESHOLD_METERS;
  const guidanceStatus: GuidanceStatus =
    isNavigating && isComputingRoute ? 'rerouting' : isOffRoute ? 'off-route' : 'on-route';

  // Recalcul automatique : sorti du tracé depuis quelques secondes et en
  // mouvement, on redemande un itinéraire depuis la position actuelle vers
  // les arrêts restants. Évalué à chaque point GPS (`progress` change), sans
  // minuteur : à l'arrêt, aucun point n'arrive et rien ne tourne (C1).
  //   - délai : un écart bref (bruit GPS, dépassement large) ne doit pas
  //     déclencher de requête ;
  //   - en mouvement seulement : garé à 100 m de la route, on resterait sinon
  //     à recalculer en boucle un trajet identique ;
  //   - pause entre deux recalculs : laisse le temps au nouveau tracé
  //     d'arriver et d'être rejoint, et borne le trafic réseau si le
  //     recalcul échoue (C3).
  useEffect(() => {
    if (!isNavigating || !isOffRoute) {
      offRouteSinceRef.current = undefined;
      return;
    }

    const now = Date.now();
    offRouteSinceRef.current ??= now;
    const isMoving = (vehiclePosition?.speedMps ?? 0) >= REROUTE_MIN_SPEED_MPS;
    if (
      isComputingRoute ||
      !isMoving ||
      now - offRouteSinceRef.current < REROUTE_DELAY_MS ||
      now - lastRerouteAtRef.current < REROUTE_COOLDOWN_MS
    ) {
      return;
    }

    lastRerouteAtRef.current = now;
    offRouteSinceRef.current = undefined;
    // Les arrêts déjà atteints sortent du trajet, sauf le dernier : la
    // destination finale reste toujours à rejoindre.
    const { stopsReached } = progress;
    if (stopsReached > 0) {
      setStops((previous) => previous.slice(Math.min(stopsReached, previous.length - 1)));
    }
    setRerouteToken((token) => token + 1);
  }, [isNavigating, isOffRoute, progress, isComputingRoute, vehiclePosition?.speedMps]);

  return (
    <View style={styles.container}>
      <Map
        style={styles.map}
        mapStyle={mapStyle}
        onRegionWillChange={handleMapMoveStart}
        onLongPress={handleMapLongPress}
        // Carte verrouillée au nord en préparation. Une carte tournée de
        // travers oblige à se réorienter mentalement avant de lire quoi que
        // ce soit — l'inverse de ce qu'on veut d'un coup d'œil en roulant
        // (C2). Le suivi de position ne rétablit jamais de rotation de son
        // côté : en mode "default" il reprend le cap courant sans le
        // modifier, seuls "heading" et "course" font pivoter la carte — c'est
        // le choix du mode guidage ci-dessous.
        touchRotate={false}
      >
        <Camera
          ref={cameraRef}
          initialViewState={INITIAL_VIEW_STATE}
          // Aussi en prop déclarative, pas seulement dans l'état initial : le
          // suivi de position reconstruit la caméra à chaque point GPS et y
          // remet une inclinaison nulle si elle ne vient pas d'ici
          // (MLRNCamera.kt — `tilt(stop?.pitch ?: 0.0)`).
          pitch={cameraPitch}
          {...(followsUser ? { trackUserLocation: trackingMode } : {})}
        />
        {/* Ordre = ordre de dessin (chaque calque ajouté peint par-dessus les
            précédents) : la ligne du tracé d'abord, sous les épingles
            d'arrêt, elles-mêmes sous le marqueur de position — toujours
            visible en dernier, jamais caché par le tracé ou un arrêt. */}
        {route !== undefined ? <RouteLine path={route.path} /> : null}
        {isNavigating && guidanceStatus === 'on-route' && progress?.nextManeuver !== undefined ? (
          <ManeuverMarker point={progress.nextManeuver.point} />
        ) : null}
        {stops.length > 0 ? (
          <StopMarkers points={stops.map((stop) => ({ latitude: stop.latitude, longitude: stop.longitude }))} />
        ) : null}
        {permission === 'granted' && isStyleReady ? <VehicleMarker /> : null}
      </Map>

      {/* RouteStatusChips avant AddressSearchBar : entre deux enfants en
          position absolute, React Native peint les derniers par-dessus les
          premiers — la barre de recherche doit passer devant pour que son
          panneau de suggestions/historique ne soit jamais recouvert par la
          ligne de puces, même quand il déborde par-dessus. */}
      {!isNavigating ? (
        <View
          style={[
            styles.routeStatusChipsWrapper,
            { top: insets.top + APP_HEADER_HEIGHT + spacing.sm + SEARCH_BAR_HEIGHT + spacing.sm },
          ]}
        >
          <RouteStatusChips />
        </View>
      ) : null}

      {!isNavigating && isSearchPanelOpen ? (
        <Pressable
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.searchDismissOverlay}
          onPress={() => {
            searchInputRef.current?.blur();
            Keyboard.dismiss();
          }}
        />
      ) : null}

      {!isNavigating ? (
        <AddressSearchBar
          ref={searchInputRef}
          onSelect={handleAddStop}
          originRef={originRef}
          onUnavailableFeature={snackbar.show}
          topOffset={APP_HEADER_HEIGHT}
          onPanelVisibleChange={setIsSearchPanelOpen}
        />
      ) : null}

      {permission === 'granted' && !isNavigating ? (
        <RecenterButton
          isFollowing={isFollowing}
          onPress={handleRecenter}
          {...(recenterButtonBottom !== undefined ? { bottom: recenterButtonBottom } : {})}
        />
      ) : null}

      {permission === 'granted' && !isNavigating ? (
        <MapModeButton
          bottom={mapModeButtonBottom}
          onPress={() => {
            snackbar.show(MAP_MODE_UNAVAILABLE_MESSAGE);
          }}
        />
      ) : null}

      {permission === 'denied' ? (
        <View style={styles.permissionBanner}>
          <Text variant="body" color={colors.textPrimary}>
            Active la localisation dans les réglages du téléphone pour te situer sur la carte.
          </Text>
        </View>
      ) : null}

      {/* Pas de position, pas d'itinéraire à récapituler : la bannière de
          permission ci-dessus explique déjà la situation, inutile d'ajouter
          une carte bloquée sur "Calcul…" qui ne se résoudra jamais. */}
      {showsTripSummary ? (
        <TripSummaryCard
          stops={stops}
          route={route}
          isComputing={isComputingRoute}
          error={routeError}
          onRemoveStop={handleRemoveStop}
          onReorderStop={handleReorderStop}
          stopTags={stopTags}
          onSetStopTag={handleSetStopTag}
          onAddStop={() => {
            searchInputRef.current?.focus();
          }}
          onStart={handleStart}
          onSaveRoute={handleSaveRoute}
          isSavingRoute={isSavingRoute}
          isRouteSaved={isRouteSaved}
          onLayout={handleTripSummaryCardLayout}
        />
      ) : null}

      {isNavigating && progress !== undefined ? (
        <View
          style={styles.maneuverBannerWrapper}
          onLayout={(event) => {
            setManeuverBannerHeight(event.nativeEvent.layout.height);
          }}
        >
          <ManeuverBanner
            status={guidanceStatus}
            maneuver={progress.nextManeuver}
            distanceMeters={progress.distanceToNextManeuver}
            thenManeuver={progress.thenManeuver}
          />
        </View>
      ) : null}

      {isNavigating ? (
        <View style={[styles.headingBadgeWrapper, { top: maneuverBannerHeight + spacing.sm }]}>
          <HeadingBadge headingDeg={vehiclePosition?.headingDeg} />
        </View>
      ) : null}

      {isNavigating ? (
        <View style={[styles.guidanceMapButtons, { top: maneuverBannerHeight + spacing.sm }]}>
          <GuidanceMapButton accessibilityLabel="Recentrer la carte" onPress={handleRecenter}>
            <MaterialCommunityIcons name="crosshairs-gps" size={20} color={colors.textPrimary} />
          </GuidanceMapButton>
          <GuidanceMapButton
            accessibilityLabel={voiceEnabled ? 'Désactiver le guidage vocal' : 'Activer le guidage vocal'}
            onPress={() => {
              setVoiceEnabled(!voiceEnabled);
            }}
          >
            <MaterialCommunityIcons
              name={voiceEnabled ? 'volume-high' : 'volume-off'}
              size={20}
              color={colors.textPrimary}
            />
          </GuidanceMapButton>
        </View>
      ) : null}

      {isNavigating && progress !== undefined ? (
        <GuidanceFooter
          speedMps={vehiclePosition?.speedMps}
          speedLimitMps={progress.speedLimitMps}
          distanceRemainingMeters={progress.distanceRemaining}
          durationRemainingSeconds={progress.durationRemaining}
          onOpenMenu={() => {
            setIsDirectionsExpanded(true);
          }}
        />
      ) : null}

      <DirectionsSheet
        visible={isNavigating && isDirectionsExpanded}
        steps={maneuverSteps.slice(progress?.nextManeuverIndex ?? maneuverSteps.length)}
        distanceToFirstMeters={progress?.distanceToNextManeuver}
        onClose={() => {
          setIsDirectionsExpanded(false);
        }}
        onExitGuidance={() => {
          setIsDirectionsExpanded(false);
          handleExit();
        }}
      />

      {!isNavigating ? (
        <View style={[styles.snackbarWrapper, { bottom: insets.bottom + spacing.sm }]}>
          <Snackbar message={snackbar.message} />
        </View>
      ) : null}

      {rideSummary !== undefined ? (
        <RideSummaryScreen
          rideId={rideSummary.rideId}
          summary={rideSummary.summary}
          points={rideSummary.points}
          onSaved={discardJournal}
          onClose={() => {
            // Fermer le résumé sans sauvegarder est un choix : la balade
            // n'est plus proposée à la récupération.
            discardJournal();
            setRideSummary(undefined);
          }}
        />
      ) : null}
    </View>
  );
}
