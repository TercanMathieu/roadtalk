import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const styles = StyleSheet.create({
  stepActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragHandle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 122, 26, 0.12)',
  },
  tagLabel: {
    fontSize: 9,
  },
  addTag: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  addTagLabel: {
    fontSize: 9,
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    paddingLeft: 2,
  },
  pickerChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: colors.surfaceMuted,
  },
  pickerChipActive: {
    backgroundColor: colors.accent,
  },
  pickerChipLabel: {
    fontSize: 11,
  },
});
