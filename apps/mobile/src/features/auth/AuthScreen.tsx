import type React from 'react';
import { View } from 'react-native';

import { Button, colors, Text } from '../../ui';
import { styles } from './AuthScreen.styles';
import { useGoogleSignIn } from './useGoogleSignIn';

// Apple arrivera une fois le compte Apple Developer Program en place (F1) —
// pas de bouton désactivé en attendant, ce serait une fonctionnalité à moitié
// construite.
export function AuthScreen(): React.JSX.Element {
  const { isSigningIn, error, signIn } = useGoogleSignIn();

  return (
    <View style={styles.container}>
      <Text variant="title" style={styles.title}>
        RoadTalk
      </Text>
      <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
        Connecte-toi pour préparer tes balades.
      </Text>

      <Button
        label={isSigningIn ? 'Connexion...' : 'Continuer avec Google'}
        onPress={signIn}
        disabled={isSigningIn}
      />

      {error !== undefined ? (
        <Text variant="body" color={colors.danger} style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
