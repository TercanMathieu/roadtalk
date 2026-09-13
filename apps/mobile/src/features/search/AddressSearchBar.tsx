import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AddressSuggestionDto } from '@roadtalk/contracts';
import type React from 'react';
import type { RefObject } from 'react';
import { Keyboard, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LastKnownPosition } from '../../lib/useLastKnownPosition';
import { colors, spacing, Text } from '../../ui';
import { styles } from './AddressSearchBar.styles';
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

  const handleSelect = (suggestion: AddressSuggestionDto): void => {
    Keyboard.dismiss();
    clear();
    onSelect(suggestion);
  };

  const hasPanel = query.trim().length > 0;

  return (
    <View style={[styles.container, { top: insets.top + spacing.sm }]}>
      <View style={styles.bar}>
        <MaterialCommunityIcons name="magnify" size={ICON_SIZE} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
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
          <PanelContent
            results={results}
            isSearching={isSearching}
            error={error}
            onSelect={handleSelect}
          />
        </View>
      ) : null}
    </View>
  );
}

interface PanelContentProps {
  readonly results: readonly AddressSuggestionDto[];
  readonly isSearching: boolean;
  readonly error: string | undefined;
  readonly onSelect: (suggestion: AddressSuggestionDto) => void;
}

function PanelContent({
  results,
  isSearching,
  error,
  onSelect,
}: PanelContentProps): React.JSX.Element {
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
