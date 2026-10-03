import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AddressSuggestionDto } from '@roadtalk/contracts';
import type React from 'react';
import type { ComponentProps, RefObject } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LastKnownPosition } from '../../lib/useLastKnownPosition';
import { colors, spacing, Text } from '../../ui';
import { useAddressSearch } from '../search/useAddressSearch';
import { styles } from './PlacePickerSheet.styles';

const CLOSE_ICON_SIZE = 24;
const OPTION_ICON_SIZE = 20;

interface DefaultOption {
  readonly label: string;
  readonly icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
}

interface Props {
  readonly visible: boolean;
  readonly title: string;
  // Le choix « sans lieu précis » proposé en tête : « Ma position » pour le
  // départ, « Au choix de l'IA » pour l'arrivée.
  readonly defaultOption: DefaultOption;
  readonly biasRef: RefObject<LastKnownPosition | undefined>;
  // `undefined` : le motard a choisi l'option par défaut.
  readonly onSelect: (place: AddressSuggestionDto | undefined) => void;
  readonly onClose: () => void;
}

export function PlacePickerSheet({
  visible,
  title,
  defaultOption,
  biasRef,
  onSelect,
  onClose,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const search = useAddressSearch(biasRef);

  const close = (): void => {
    search.clear();
    onClose();
  };

  const select = (place: AddressSuggestionDto | undefined): void => {
    search.clear();
    onSelect(place);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Text variant="title" style={styles.title}>
            {title}
          </Text>
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            style={styles.closeButton}
          >
            <MaterialCommunityIcons
              name="close"
              size={CLOSE_ICON_SIZE}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        <View style={styles.searchField}>
          <MaterialCommunityIcons
            name="magnify"
            size={OPTION_ICON_SIZE}
            color={colors.textSecondary}
          />
          <TextInput
            value={search.query}
            onChangeText={search.setQuery}
            placeholder="Ville, col, lieu…"
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              select(undefined);
            }}
            style={({ pressed }) => [styles.option, pressed ? styles.pressed : null]}
          >
            <MaterialCommunityIcons
              name={defaultOption.icon}
              size={OPTION_ICON_SIZE}
              color={colors.accent}
            />
            <Text variant="body">{defaultOption.label}</Text>
          </Pressable>

          {search.error !== undefined ? (
            <Text variant="body" color={colors.textSecondary} style={styles.message}>
              {search.error}
            </Text>
          ) : search.isSearching && search.results.length === 0 ? (
            <Text variant="body" color={colors.textSecondary} style={styles.message}>
              Recherche…
            </Text>
          ) : (
            search.results.map((place, index) => (
              <Pressable
                key={`${String(index)}-${place.label}-${String(place.latitude)}-${String(place.longitude)}`}
                accessibilityRole="button"
                onPress={() => {
                  select(place);
                }}
                style={({ pressed }) => [styles.result, pressed ? styles.pressed : null]}
              >
                <Text variant="body" numberOfLines={1}>
                  {place.label}
                </Text>
                {place.context !== null ? (
                  <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
                    {place.context}
                  </Text>
                ) : null}
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
