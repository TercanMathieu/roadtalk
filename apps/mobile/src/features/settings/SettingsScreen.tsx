import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type React from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, MockTag, SegmentedToggle, Snackbar, spacing, Text, Toggle, useSnackbar } from '../../ui';
import { useAuthStore, withFreshAccessToken } from '../auth/auth.store';
import { APP_HEADER_HEIGHT } from '../map/AppHeader.styles';
import { deleteMe } from '../profile/api';
import { type DistanceUnit, useSettingsStore } from './settings.store';
import { SettingsActionButton } from './SettingsActionButton';
import { SettingsCard } from './SettingsCard';
import { SettingsRow } from './SettingsRow';
import { styles } from './SettingsScreen.styles';
import { SettingsSectionHeader } from './SettingsSectionHeader';

const UNIT_OPTIONS: readonly { value: DistanceUnit; label: string }[] = [
  { value: 'km', label: 'km/h' },
  { value: 'mi', label: 'mph' },
];

const COMING_SOON_MESSAGE = 'Fonctionnalité bientôt disponible.';
const DELETE_FAILED_MESSAGE = 'La suppression a échoué, réessaie plus tard.';

export function SettingsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const username = useAuthStore((state) => state.username);
  const tag = useAuthStore((state) => state.tag);
  const provider = useAuthStore((state) => state.provider);
  const distanceUnit = useSettingsStore((state) => state.distanceUnit);
  const setDistanceUnit = useSettingsStore((state) => state.setDistanceUnit);
  const voiceEnabled = useSettingsStore((state) => state.voiceEnabled);
  const setVoiceEnabled = useSettingsStore((state) => state.setVoiceEnabled);
  const avoidHighways = useSettingsStore((state) => state.avoidHighways);
  const setAvoidHighways = useSettingsStore((state) => state.setAvoidHighways);
  const snackbar = useSnackbar();

  const handleDeleteAccount = (): void => {
    Alert.alert(
      'Supprimer le compte et les données ?',
      'Action irréversible, conforme au droit à l’oubli (Art. 17 RGPD).',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            withFreshAccessToken((accessToken) => deleteMe(accessToken))
              .then(() => useAuthStore.getState().signOut())
              .catch(() => {
                snackbar.show(DELETE_FAILED_MESSAGE);
              });
          },
        },
      ],
    );
  };

  // Apple n'est pas encore implémenté côté mobile (F1 — compte Apple
  // Developer Program à mettre en place) : en pratique toujours "google"
  // aujourd'hui, mais dérivé du compte réel pour rester correct dès qu'Apple
  // arrivera, plutôt qu'un texte figé.
  const providerLabel = provider === 'apple' ? 'Apple' : 'Google';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + APP_HEADER_HEIGHT + spacing.sm }]}
    >
      <Text variant="title">Cockpit</Text>

      <View style={styles.section}>
        <SettingsSectionHeader icon="compass-outline" title="Navigation" />
        <SettingsCard>
          <SettingsRow
            icon="volume-high"
            title="Instructions vocales"
            subtitle={voiceEnabled ? 'Activées' : 'Désactivées'}
          >
            <Toggle value={voiceEnabled} onValueChange={setVoiceEnabled} accessibilityLabel="Guidage vocal" />
          </SettingsRow>

          <SettingsRow icon="highway" title="Éviter les autoroutes" subtitle="Appliqué au calcul d'itinéraire">
            <Toggle
              value={avoidHighways}
              onValueChange={setAvoidHighways}
              accessibilityLabel="Éviter les autoroutes"
            />
          </SettingsRow>

          <SettingsRow
            icon="speedometer"
            title="Unités"
            subtitle={distanceUnit === 'km' ? 'Métrique' : 'Impérial'}
          >
            <SegmentedToggle options={UNIT_OPTIONS} value={distanceUnit} onChange={setDistanceUnit} />
          </SettingsRow>
        </SettingsCard>
      </View>

      {/* Fonctions pas encore construites : une ligne discrète chacune
          (<MockTag />), plutôt que des jauges et interrupteurs qui ne
          pilotaient rien. */}
      <View style={styles.section}>
        <SettingsSectionHeader icon="clock-outline" title="À venir" />
        <SettingsCard>
          <SettingsRow icon="map-outline" title="Cartes hors-ligne" subtitle="Pré-cache du corridor de l'itinéraire">
            <MockTag />
          </SettingsRow>
          <SettingsRow icon="alert-octagon-outline" title="Zones de danger" subtitle="Alerte sonore discrète">
            <MockTag />
          </SettingsRow>
        </SettingsCard>
      </View>

      <View style={styles.section}>
        <SettingsSectionHeader icon="shield-check-outline" title="Compte & données" />
        <SettingsCard>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ouvrir ma fiche"
            onPress={() => {
              router.push('/profile');
            }}
            style={({ pressed }) => (pressed ? styles.pressed : null)}
          >
            <SettingsRow
              icon="account-circle-outline"
              title={username !== null && username !== undefined ? `${username}#${tag ?? ''}` : 'Session authentifiée'}
              subtitle={`Connecté via ${providerLabel}`}
            >
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
            </SettingsRow>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Exporter mes données"
            onPress={() => {
              snackbar.show(COMING_SOON_MESSAGE);
            }}
            style={({ pressed }) => (pressed ? styles.pressed : null)}
          >
            <SettingsRow icon="export-variant" title="Exporter mes données" subtitle="Profil et historique de recherche">
              <MockTag />
            </SettingsRow>
          </Pressable>
        </SettingsCard>
        <Text variant="caption" color={colors.textSecondary} style={styles.note}>
          Ta position sert uniquement à calculer ton itinéraire et te situer sur la carte. Aucune donnée de
          localisation n’est partagée avec un tiers.
        </Text>
      </View>

      <SettingsActionButton
        icon="delete-forever-outline"
        label="Supprimer le compte et les données"
        description="Action irréversible, conforme au droit à l’oubli (Art. 17 RGPD)."
        variant="danger"
        onPress={handleDeleteAccount}
      />

      <Snackbar message={snackbar.message} />
    </ScrollView>
  );
}
