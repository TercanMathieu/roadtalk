import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AddressHistoryEntryDto, AddressSuggestionDto } from '@roadtalk/contracts';
import type React from 'react';
import type { RefObject } from 'react';
import { useState } from 'react';
import { Keyboard, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LastKnownPosition } from '../../lib/useLastKnownPosition';
import { colors, spacing, Text } from '../../ui';
import { withFreshAccessToken } from '../auth/auth.store';
import { styles } from './AddressSearchBar.styles';
import { recordAddressSelection } from './historyApi';
import { useAddressHistory } from './useAddressHistory';
import { useAddressSearch } from './useAddressSearch';

const ICON_SIZE = 22;

interface Props {
  readonly onSelect: (suggestion: AddressSuggestionDto) => void;
  // Position de l'utilisateur, pour proposer d'abord les adresses proches.
  readonly originRef: RefObject<LastKnownPosition | undefined>;
}

export function AddressSearchBar({ onSelect, originRef }: Props): React.JSX.Element {
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

  return (
    <View style={[styles.container, { top: insets.top + spacing.sm }]}>
      <View style={styles.bar}>
        <MaterialCommunityIcons name="magnify" size={ICON_SIZE} color={colors.textSecondary} />
        <TextInput
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
          placeholder="Où aller ?"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <Pressable onPress={clear} accessibilityRole="button" style={styles.clearButton}>
            <MaterialCommunityIcons name="close" size={ICON_SIZE} color={colors.textSecondary} />
          </Pressable>
        ) : null}
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
          key={`${suggestion.label}-${String(suggestion.latitude)}-${String(suggestion.longitude)}`}
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
          <Text variant="body" numberOfLines={1}>
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
          key={`${entry.label}-${String(entry.latitude)}-${String(entry.longitude)}`}
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
          <MaterialCommunityIcons name="history" size={ICON_SIZE} color={colors.textSecondary} />
          <View style={styles.historyText}>
            <Text variant="body" numberOfLines={1}>
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
