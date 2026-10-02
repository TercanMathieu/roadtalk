import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, MockBanner, MockTag, SegmentedToggle, Snackbar, spacing, Text, Toggle, useSnackbar } from '../../ui';
import { useAuthStore, withFreshAccessToken } from '../auth/auth.store';
import { APP_HEADER_HEIGHT } from '../map/AppHeader.styles';
import { deleteMe } from '../profile/api';
import { CacheGaugeCard } from './CacheGaugeCard';
import { PilotStatusBanner } from './PilotStatusBanner';
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
  const username = useAuthStore((state) => state.username);
  const provider = useAuthStore((state) => state.provider);
  const distanceUnit = useSettingsStore((state) => state.distanceUnit);
  const setDistanceUnit = useSettingsStore((state) => state.setDistanceUnit);
  const voiceEnabled = useSettingsStore((state) => state.voiceEnabled);
  const setVoiceEnabled = useSettingsStore((state) => state.setVoiceEnabled);
  const avoidHighways = useSettingsStore((state) => state.avoidHighways);
  const setAvoidHighways = useSettingsStore((state) => state.setAvoidHighways);
  const dangerAlertsEnabled = useSettingsStore((state) => state.dangerAlertsEnabled);
  const setDangerAlertsEnabled = useSettingsStore((state) => state.setDangerAlertsEnabled);
  const corridorAutoDownloadEnabled = useSettingsStore((state) => state.corridorAutoDownloadEnabled);
  const setCorridorAutoDownloadEnabled = useSettingsStore(
    (state) => state.setCorridorAutoDownloadEnabled,
  );
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
      <PilotStatusBanner />

      <View style={styles.section}>
        <SettingsSectionHeader icon="compass-outline" title="Navigation & cockpit" />
        <SettingsCard>
          <SettingsRow icon="monitor" title="Mode d'affichage" subtitle="OLED sombre haute visibilité">
            <View style={styles.staticBadge}>
              <Text variant="monoBold" color={colors.accent}>
                ACTIF
              </Text>
            </View>
          </SettingsRow>

          <SettingsRow
            icon="headset"
            title="Instructions vocales"
            subtitle={voiceEnabled ? 'Guidage vocal activé' : 'Guidage vocal désactivé'}
            {...(voiceEnabled ? { subtitleColor: colors.accentLight } : {})}
          >
            <Toggle value={voiceEnabled} onValueChange={setVoiceEnabled} accessibilityLabel="Guidage vocal" />
          </SettingsRow>

          <SettingsRow
            icon="speedometer"
            title="Unités de mesure"
            subtitle={distanceUnit === 'km' ? 'Format métrique' : 'Format impérial'}
          >
            <SegmentedToggle options={UNIT_OPTIONS} value={distanceUnit} onChange={setDistanceUnit} />
          </SettingsRow>

          <SettingsRow icon="highway" title="Éviter les autoroutes" subtitle="Calcul d'itinéraire">
            <Toggle
              value={avoidHighways}
              onValueChange={setAvoidHighways}
              accessibilityLabel="Éviter les autoroutes"
            />
          </SettingsRow>

          <SettingsRow
            icon="alert-octagon-outline"
            title="Zones de danger & radars"
            subtitle="Alerte sonore discrète casque"
          >
            <View style={styles.rowTrailing}>
              <Toggle
                value={dangerAlertsEnabled}
                onValueChange={setDangerAlertsEnabled}
                accessibilityLabel="Alertes zones de danger et radars"
              />
              <MockTag />
            </View>
          </SettingsRow>
        </SettingsCard>
      </View>

      <View style={styles.section}>
        <SettingsSectionHeader icon="map-outline" title="Cartes hors-ligne & données" trailing="STOCKAGE" />
        <View style={styles.looseCard}>
          <MockBanner message="Aperçu — pré-cache hors-ligne pas encore construit." />
          <CacheGaugeCard />

          <SettingsRow
            icon="download-outline"
            title="Téléchargement corridor"
            subtitle="Précharge 5 km autour du tracé"
          >
            <Toggle
              value={corridorAutoDownloadEnabled}
              onValueChange={setCorridorAutoDownloadEnabled}
              accessibilityLabel="Téléchargement automatique du corridor"
            />
          </SettingsRow>

          <SettingsActionButton
            icon="trash-can-outline"
            label="VIDER LE CACHE HORS-LIGNE"
            onPress={() => {
              snackbar.show('Aucun cache à vider pour l’instant.');
            }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SettingsSectionHeader icon="shield-check-outline" title="Données personnelles & RGPD" />
        <View style={styles.looseCard}>
          <View style={styles.identityRow}>
            <View style={styles.identityIconSquare}>
              <MaterialCommunityIcons name="shield-account-outline" size={22} color={colors.textPrimary} />
            </View>
            <View style={styles.identityTexts}>
              <Text variant="mono" color={colors.textDense}>
                COMPTE
              </Text>
              <Text variant="body">{username ?? 'Session authentifiée'}</Text>
              <Text variant="mono" color={colors.accentLight}>
                {`Connecté via ${providerLabel}`}
              </Text>
            </View>
          </View>

          <View style={styles.identityRow}>
            <View style={styles.identityIconSquare}>
              <MaterialCommunityIcons name="eye-off-outline" size={20} color={colors.textPrimary} />
            </View>
            <View style={styles.identityTexts}>
              <Text variant="body">Localisation traitée en local</Text>
              <Text variant="mono" color={colors.textDense} style={styles.identityParagraph}>
                Ta position sert uniquement à calculer ton itinéraire et te situer sur la carte. Aucune donnée de
                localisation n’est partagée avec un tiers.
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Exporter mes données"
            onPress={() => {
              snackbar.show(COMING_SOON_MESSAGE);
            }}
            style={({ pressed }) => [styles.exportRow, pressed ? styles.exportRowPressed : null]}
          >
            <View style={styles.exportRowLeading}>
              <MaterialCommunityIcons name="export-variant" size={18} color={colors.textPrimary} />
              <View style={styles.exportRowTexts}>
                <Text variant="body">Exporter mes données</Text>
                <Text variant="mono" color={colors.textDense}>
                  Profil et historique de recherche
                </Text>
              </View>
            </View>
            <MockTag />
          </Pressable>

          <SettingsActionButton
            icon="delete-forever-outline"
            label="SUPPRIMER COMPTE & DONNÉES"
            description="Action irréversible, conforme au droit à l’oubli (Art. 17 RGPD)."
            variant="danger"
            onPress={handleDeleteAccount}
          />
        </View>
      </View>

      <Snackbar message={snackbar.message} />
    </ScrollView>
  );
}
