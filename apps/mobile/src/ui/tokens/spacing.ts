export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

// Cibles tactiles ≥ 64dp : utilisation avec des gants, aucun geste fin (section 8).
export const MIN_TOUCH_TARGET_DP = 64;
