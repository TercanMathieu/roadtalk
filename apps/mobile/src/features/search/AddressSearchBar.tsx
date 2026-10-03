import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AddressHistoryEntryDto, AddressSuggestionDto } from '@roadtalk/contracts';
import type React from 'react';
import type { Ref, RefObject } from 'react';
import { useEffect, useState } from 'react';
import { Keyboard, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LastKnownPosition } from '../../lib/useLastKnownPosition';
import { colors, spacing, Text } from '../../ui';
import { withFreshAccessToken } from '../auth/auth.store';
import { styles } from './AddressSearchBar.styles';
import { recordAddressSelection } from './historyApi';
import { useAddressHistory } from './useAddressHistory';
import { useAddressSearch } from './useAddressSearch';

const ICON_SIZE = 19;
const HISTORY_ICON_SIZE = 16;

interface Props {
  readonly onSelect: (suggestion: AddressSuggestionDto) => void;
  // Position de l'utilisateur, pour proposer d'abord les adresses proches.
  readonly originRef: RefObject<LastKnownPosition | undefined>;
  // Recherche vocale et import GPX : aucune des deux n'est construite
  // (ni reconnaissance vocale, ni parseur GPX) — ce callback signale juste
  // que l'action demandée n'est pas encore disponible, à l'appelant de
  // décider comment (Snackbar côté MapScreen).
  readonly onUnavailableFeature: (message: string) => void;
  // Permet à l'écran parent de donner le focus depuis ailleurs (ex. bouton
  // "Ajouter un arrêt" de TripSummaryCard) — React 19 accepte `ref` comme
  // une prop normale sur les composants fonction, pas besoin de forwardRef.
  readonly ref?: Ref<TextInput>;
  // Décalage additionnel sous la zone de sécurité (ex. hauteur d'AppHeader,
  // quand affiché) — 0 par défaut, pas une valeur que ce composant devine
  // lui-même puisqu'il ne sait pas si un en-tête est monté au-dessus.
  readonly topOffset?: number;
  // Signale au parent quand le panneau (résultats ou historique) est visible
  // — lui permet de superposer une zone invisible qui referme le panneau au
  // premier toucher ailleurs à l'écran (voir MapScreen).
  readonly onPanelVisibleChange?: (visible: boolean) => void;
  // Texte du champ vide — change quand la recherche sert à choisir le départ.
  readonly placeholder?: string;
}

const VOICE_SEARCH_UNAVAILABLE_MESSAGE = 'Recherche vocale bientôt disponible.';
const GPX_IMPORT_UNAVAILABLE_MESSAGE = 'Import GPX bientôt disponible.';

export function AddressSearchBar({
  onSelect,
  originRef,
  onUnavailableFeature,
  ref,
  topOffset = 0,
  placeholder = 'Destination, col alpin, étape…',
  onPanelVisibleChange,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { query, results, isSearching, error, setQuery, clear } = useAddressSearch(originRef);
  const history = useAddressHistory();
  const [isFocused, setIsFocused] = useState(false);

  const handleSelect = (suggestion: AddressSuggestionDto): void => {
    Keyboard.dismiss();
    clear();
    setIsFocused(false);
    onSelect(suggestion);

    // Best-effort : l'échec de l'enregistrement ne doit jamais faire échouer
    // la sélection elle-même, l'utilisateur a déjà ce qu'il voulait.
    withFreshAccessToken((accessToken) => recordAddressSelection(accessToken, suggestion)).catch(() => {
      // Rien à faire ici : l'adresse manquera juste de l'historique cette
      // fois, sans conséquence sur la navigation en cours.
    });
  };

  const handleFocus = (): void => {
    setIsFocused(true);
    history.refresh();
  };

  const showingSearch = query.trim().length > 0;
  // Panel affiché soit pour les résultats de recherche (dès que la barre
  // contient du texte), soit pour l'historique (au focus, tant qu'elle est
  // vide) — jamais les deux à la fois.
  const hasPanel = showingSearch || isFocused;

  useEffect(() => {
    onPanelVisibleChange?.(hasPanel);
  }, [hasPanel, onPanelVisibleChange]);

  return (
    <View style={[styles.container, { top: insets.top + topOffset + spacing.sm }]}>
      <View style={styles.row}>
        <View style={styles.searchColumn}>
          <View style={styles.bar}>
            <MaterialCommunityIcons name="magnify" size={ICON_SIZE} color={colors.textSecondary} />
            <TextInput
              ref={ref}
              value={query}
              onChangeText={setQuery}
              onFocus={handleFocus}
              // Pas de délai avant de masquer : les lignes du panneau restent
              // fiables au toucher malgré la perte de focus qui précède leur
              // `onPress`, comme déjà observé sur le panneau de résultats de
              // recherche (aucun workaround nécessaire en pratique sur ce projet).
              onBlur={() => {
                setIsFocused(false);
              }}
              placeholder={placeholder}
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <Pressable onPress={clear} accessibilityRole="button" style={styles.clearButton}>
                <MaterialCommunityIcons name="close" size={ICON_SIZE} color={colors.textSecondary} />
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Recherche vocale"
                hitSlop={8}
                onPress={() => {
                  onUnavailableFeature(VOICE_SEARCH_UNAVAILABLE_MESSAGE);
                }}
                style={styles.voiceButton}
              >
                <MaterialCommunityIcons name="microphone-outline" size={ICON_SIZE} color={colors.textDense} />
              </Pressable>
            )}
          </View>

          {hasPanel ? (
            <View style={styles.panel}>
              {showingSearch ? (
                <SearchPanelContent
                  results={results}
                  isSearching={isSearching}
                  error={error}
                  onSelect={handleSelect}
                />
              ) : (
                <HistoryPanelContent
                  entries={history.entries}
                  isLoading={history.isLoading}
                  error={history.error}
                  onSelect={handleSelect}
                />
              )}
            </View>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Importer un fichier GPX"
          onPress={() => {
            onUnavailableFeature(GPX_IMPORT_UNAVAILABLE_MESSAGE);
          }}
          style={styles.gpxButton}
        >
          <MaterialCommunityIcons name="file-upload-outline" size={ICON_SIZE} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

interface SearchPanelContentProps {
  readonly results: readonly AddressSuggestionDto[];
  readonly isSearching: boolean;
  readonly error: string | undefined;
  readonly onSelect: (suggestion: AddressSuggestionDto) => void;
}

function SearchPanelContent({
  results,
  isSearching,
  error,
  onSelect,
}: SearchPanelContentProps): React.JSX.Element {
  if (error !== undefined) {
    return (
      <Text variant="body" color={colors.danger} style={styles.message}>
        {error}
      </Text>
    );
  }

  // Les résultats précédents restent affichés pendant une nouvelle recherche :
  // moins de clignotement que de vider la liste à chaque frappe.
  if (results.length === 0) {
    return (
      <Text variant="body" color={colors.textSecondary} style={styles.message}>
        {isSearching ? 'Recherche…' : 'Aucune adresse trouvée.'}
      </Text>
    );
  }

  return (
    <>
      {results.map((suggestion, index) => (
        <Pressable
          key={`${String(index)}-${suggestion.label}-${String(suggestion.latitude)}-${String(suggestion.longitude)}`}
          accessibilityRole="button"
          onPress={() => {
            onSelect(suggestion);
          }}
          style={({ pressed }) => [
            styles.suggestion,
            index === 0 ? styles.firstSuggestion : null,
            pressed ? styles.suggestionPressed : null,
          ]}
        >
          <Text variant="body" numberOfLines={1} style={styles.suggestionLabel}>
            {suggestion.label}
          </Text>
          {suggestion.context !== null ? (
            <Text
              variant="label"
              color={colors.textSecondary}
              numberOfLines={1}
              style={styles.suggestionContext}
            >
              {suggestion.context}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </>
  );
}

interface HistoryPanelContentProps {
  readonly entries: readonly AddressHistoryEntryDto[];
  readonly isLoading: boolean;
  readonly error: string | undefined;
  readonly onSelect: (suggestion: AddressSuggestionDto) => void;
}

function HistoryPanelContent({
  entries,
  isLoading,
  error,
  onSelect,
}: HistoryPanelContentProps): React.JSX.Element {
  if (error !== undefined) {
    return (
      <Text variant="body" color={colors.danger} style={styles.message}>
        {error}
      </Text>
    );
  }

  if (entries.length === 0) {
    return (
      <Text variant="body" color={colors.textSecondary} style={styles.message}>
        {isLoading ? 'Chargement…' : 'Tes adresses récentes apparaîtront ici.'}
      </Text>
    );
  }

  return (
    <>
      {entries.map((entry, index) => (
        <Pressable
          key={`${String(index)}-${entry.label}-${String(entry.latitude)}-${String(entry.longitude)}`}
          accessibilityRole="button"
          onPress={() => {
            onSelect(entry);
          }}
          style={({ pressed }) => [
            styles.suggestion,
            styles.historySuggestion,
            index === 0 ? styles.firstSuggestion : null,
            pressed ? styles.suggestionPressed : null,
          ]}
        >
          <MaterialCommunityIcons name="history" size={HISTORY_ICON_SIZE} color={colors.textSecondary} />
          <View style={styles.historyText}>
            <Text variant="body" numberOfLines={1} style={styles.suggestionLabel}>
              {entry.label}
            </Text>
            {entry.context !== null ? (
              <Text
                variant="label"
                color={colors.textSecondary}
                numberOfLines={1}
                style={styles.suggestionContext}
              >
                {entry.context}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ))}
    </>
  );
}
