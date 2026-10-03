import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, Text } from '../../ui';
import { useAuthStore } from '../auth/auth.store';
import type { GpsStatus } from './appHeader.store';
import { styles } from './AppHeader.styles';

const GPS_ICON_SIZE = 15;
const AVATAR_ICON_SIZE = 16;

interface Props {
  // GPS réel (permission + premier fix reçu) — jamais une valeur inventée :
  // absente tant que le statut exact n'est pas connu (voir useUserLocationPermission
  // et useLastKnownPosition dans MapScreen, seuls propriétaires de cet état,
  // relayés au layout des onglets via appHeader.store pour cet en-tête
  // désormais commun aux trois onglets).
  readonly gpsStatus: GpsStatus;
}

const GPS_LABELS: Record<Props['gpsStatus'], string> = {
  checking: 'GPS…',
  searching: 'GPS…',
  ok: 'GPS',
  off: 'GPS coupé',
};

export function AppHeader({ gpsStatus }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const username = useAuthStore((state) => state.username);
  // Un GPS qui fonctionne n'a pas à attirer l'œil : seul l'état anormal
  // (coupé) prend une couleur, l'accent restant réservé aux actions.
  const gpsColor = gpsStatus === 'off' ? colors.danger : colors.textSecondary;
  const initial = typeof username === 'string' && username.length > 0 ? username.charAt(0).toUpperCase() : undefined;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <View style={styles.brandDot} />
          <Text variant="title" style={styles.brandText}>
            RoadTalk
          </Text>
        </View>

        <View style={styles.statusGroup}>
          <View style={styles.gpsStatus}>
            <MaterialCommunityIcons name="satellite-variant" size={GPS_ICON_SIZE} color={gpsColor} />
            <Text variant="caption" color={gpsColor}>
              {GPS_LABELS[gpsStatus]}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ma fiche"
            onPress={() => {
              router.push('/profile');
            }}
            style={styles.avatarButton}
          >
            {initial !== undefined ? (
              <Text variant="captionStrong" style={styles.avatarInitial}>
                {initial}
              </Text>
            ) : (
              <MaterialCommunityIcons name="account" size={AVATAR_ICON_SIZE} color={colors.textPrimary} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
