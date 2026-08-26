import type React from 'react';
import { Switch, View } from 'react-native';

import { Button, colors, Text } from '../../ui';
import { useSettingsStore } from './settings.store';
import { styles } from './SettingsScreen.styles';

export function SettingsScreen(): React.JSX.Element {
  const distanceUnit = useSettingsStore((state) => state.distanceUnit);
  const setDistanceUnit = useSettingsStore((state) => state.setDistanceUnit);
  const voiceEnabled = useSettingsStore((state) => state.voiceEnabled);
  const setVoiceEnabled = useSettingsStore((state) => state.setVoiceEnabled);

  return (
    <View style={styles.container}>
      <Text variant="title" style={styles.title}>
        Réglages
      </Text>

      <View style={styles.section}>
        <Text variant="label" color={colors.textSecondary} style={styles.sectionLabel}>
          Unités
        </Text>
        <View style={styles.unitRow}>
          <View style={styles.unitButtonWrapper}>
            <Button
              label="Kilomètres"
              variant={distanceUnit === 'km' ? 'primary' : 'secondary'}
              onPress={() => {
                setDistanceUnit('km');
              }}
            />
          </View>
          <View style={styles.unitButtonWrapper}>
            <Button
              label="Miles"
              variant={distanceUnit === 'mi' ? 'primary' : 'secondary'}
              onPress={() => {
                setDistanceUnit('mi');
              }}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.voiceRow}>
          <Text variant="body">Guidage vocal</Text>
          <Switch
            value={voiceEnabled}
            onValueChange={setVoiceEnabled}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.textPrimary}
            style={styles.voiceSwitch}
          />
        </View>
      </View>
    </View>
  );
}
