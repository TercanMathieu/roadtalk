import type React from 'react';
import { Text as RNText, type TextProps } from 'react-native';

import { colors, typography, type TypographyVariant } from './tokens';

interface Props extends TextProps {
  readonly variant?: TypographyVariant;
  readonly color?: string;
  // Vitesse/distance en guidage : jamais une soustraction de deux positions,
  // mais l'affichage lui-même doit s'aligner sur des chiffres tabulaires.
  readonly tabularNums?: boolean;
}

export function Text(props: Props): React.JSX.Element {
  const {
    variant = 'body',
    color = colors.textPrimary,
    tabularNums = false,
    style,
    ...rest
  } = props;

  return (
    <RNText
      style={[
        typography[variant],
        { color },
        tabularNums ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
      {...rest}
    />
  );
}
