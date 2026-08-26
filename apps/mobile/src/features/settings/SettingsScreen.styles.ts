import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  unitRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  unitButtonWrapper: {
    flex: 1,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voiceSwitch: {
    // Agrandit la zone de contrôle du Switch natif RN — usage avec gants (C2).
    // Provisoire : un composant Switch maison, dimensionné comme Button
    // (MIN_TOUCH_TARGET_DP), viendra remplacer ça avec le reste du design system.
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
});
