export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

// Standard iOS/Android (44dp) — l'app n'est pas pensée pour un usage ganté,
// voir CLAUDE.md C2 (décision explicite, 2026-10-01, annule l'ancien
// plancher de 64dp motivé par les gants).
export const MIN_TOUCH_TARGET_DP = 44;
