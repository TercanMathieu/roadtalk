import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type React from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { colors, MockBanner, MockTag, SegmentedToggle, Text, Toggle } from '../../ui';
import { useAuthStore } from '../auth/auth.store';
import { CacheGaugeCard } from './CacheGaugeCard';
import { PilotStatusBanner } from './PilotStatusBanner';
import { type DistanceUnit, useSettingsStore } from './settings.store';
import { SettingsActionButton } from './SettingsActionButton';
import { SettingsCard } from './SettingsCard';
import { SettingsRow } from './SettingsRow';
import { styles } from './SettingsScreen.styles';
import { SettingsSectionHeader } from './SettingsSectionHeader';
import { Snackbar } from './Snackbar';
import { useSnackbar } from './useSnackbar';

const UNIT_OPTIONS: readonly { value: DistanceUnit; label: string }[] = [
  { value: 'km', label: 'km/h' },
  { value: 'mi', label: 'mph' },
];

const COMING_SOON_MESSAGE = 'Fonctionnalité bientôt disponible.';

export function SettingsScreen(): React.JSX.Element {
  const username = useAuthStore((state) => state.username);
  const distanceUnit = useSettingsStore((state) => state.distanceUnit);
  const setDistanceUnit = useSettingsStore((state) => state.setDistanceUnit);
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
            snackbar.show(COMING_SOON_MESSAGE);
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <PilotStatusBanner />

      <View style={styles.section}>
        <SettingsSectionHeader icon="compass-outline" title="Navigation & cockpit" />
        <SettingsCard>
          <SettingsRow icon="monitor" title="Mode d'affichage" subtitle="OLED sombre haute visibilité">
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <View style={styles.staticBadge}>
                <Text variant="monoBold" color={colors.accent}>
                  ACTIF
                </Text>
              </View>
              <MockTag />
            </View>
          </SettingsRow>

          <SettingsRow icon="headset" title="Instructions vocales" subtitle="Aucun intercom associé">
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Configurer l'intercom Bluetooth"
                hitSlop={8}
                onPress={() => {
                  snackbar.show(COMING_SOON_MESSAGE);
                }}
              >
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textDense} />
              </Pressable>
              <MockTag />
            </View>
          </SettingsRow>

          <SettingsRow
            icon="speedometer"
            title="Unités de mesure"
            subtitle={distanceUnit === 'km' ? 'Format métrique' : 'Format impérial'}
          >
            <SegmentedToggle options={UNIT_OPTIONS} value={distanceUnit} onChange={setDistanceUnit} />
          </SettingsRow>

          <SettingsRow
            icon="alert-octagon-outline"
            title="Zones de danger & radars"
            subtitle="Alerte sonore discrète casque"
          >
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
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
        <SettingsSectionHeader
          icon="map-outline"
          title="Cartes hors-ligne & données"
          trailing="STOCKAGE"
        />
        <View style={styles.looseCard}>
          <MockBanner message="Aperçu — pré-cache hors-ligne pas encore construit." />
          <CacheGaugeCard />

          <SettingsRow
            icon="download-outline"
            title="Téléchargement corridor"
            subtitle="Précharge 5 km autour du tracé, navigation sans réseau"
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
                Authentification chiffrée
              </Text>
            </View>
          </View>

          <View style={styles.identityRow}>
            <View style={styles.identityIconSquare}>
              <MaterialCommunityIcons name="eye-off-outline" size={20} color={colors.textPrimary} />
            </View>
            <View style={styles.identityTexts}>
              <Text variant="body">Localisation traitée en local</Text>
              <Text variant="mono" color={colors.textDense} style={{ textTransform: 'none' }}>
                Ta position sert uniquement à calculer ton itinéraire et te situer sur la carte.
                Aucune donnée de localisation n’est partagée avec un tiers.
              </Text>
            </View>
          </View>

          <MockBanner message="Aperçu — export et suppression RGPD pas encore branchés." />

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
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textDense} />
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

      <View style={styles.section}>
        <SettingsSectionHeader icon="flask-outline" title="Aperçus design" />
        <View style={styles.looseCard}>
          <MockBanner message="Écrans non reliés au reste de l'app — aperçus visuels seuls." />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aperçu de l'écran Guidage actif cockpit"
            onPress={() => {
              router.push('/guidance');
            }}
            style={({ pressed }) => [styles.exportRow, pressed ? styles.exportRowPressed : null]}
          >
            <View style={styles.exportRowLeading}>
              <MaterialCommunityIcons name="compass-outline" size={18} color={colors.textPrimary} />
              <Text variant="body">Guidage actif cockpit</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textDense} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aperçu de l'écran Résumé de balade"
            onPress={() => {
              router.push('/ride-summary');
            }}
            style={({ pressed }) => [styles.exportRow, pressed ? styles.exportRowPressed : null]}
          >
            <View style={styles.exportRowLeading}>
              <MaterialCommunityIcons name="flag-checkered" size={18} color={colors.textPrimary} />
              <Text variant="body">Résumé de balade</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textDense} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aperçu de l'écran Générateur IA"
            onPress={() => {
              router.push('/ai-route');
            }}
            style={({ pressed }) => [styles.exportRow, pressed ? styles.exportRowPressed : null]}
          >
            <View style={styles.exportRowLeading}>
              <MaterialCommunityIcons name="creation" size={18} color={colors.textPrimary} />
              <Text variant="body">Générateur d&apos;itinéraire IA</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textDense} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aperçu de l'écran Aperçu itinéraire IA"
            onPress={() => {
              router.push('/ai-route-preview');
            }}
            style={({ pressed }) => [styles.exportRow, pressed ? styles.exportRowPressed : null]}
          >
            <View style={styles.exportRowLeading}>
              <MaterialCommunityIcons name="routes" size={18} color={colors.textPrimary} />
              <Text variant="body">Feuille de route IA</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textDense} />
          </Pressable>
        </View>
      </View>

      <Snackbar message={snackbar.message} />
    </ScrollView>
  );
}
