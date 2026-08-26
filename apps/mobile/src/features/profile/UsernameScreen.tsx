import { ErrorCode, usernameSchema } from '@roadtalk/contracts';
import type React from 'react';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { ApiError } from '../../lib/http';
import { Button, colors, Text } from '../../ui';
import { useAuthStore } from '../auth/auth.store';
import { styles } from './UsernameScreen.styles';

export function UsernameScreen(): React.JSX.Element {
  const chooseUsername = useAuthStore((state) => state.chooseUsername);
  const currentUsername = useAuthStore((state) => state.username);
  const [username, setUsername] = useState(currentUsername ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const validation = usernameSchema.safeParse(username);
  const canSubmit = validation.success && !isSubmitting;

  const submit = (): void => {
    if (!validation.success) {
      return;
    }

    setError(undefined);
    setIsSubmitting(true);
    chooseUsername(validation.data)
      .catch((caught: unknown) => {
        if (caught instanceof ApiError && caught.code === ErrorCode.USERNAME_ALREADY_TAKEN) {
          setError('Ce pseudo est déjà pris, essaie-en un autre.');
          return;
        }
        setError('Impossible d\'enregistrer ce pseudo, réessaie.');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <View style={styles.container}>
      <Text variant="title" style={styles.title}>
        Choisis ton pseudo
      </Text>
      <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
        Visible par les autres motards. Modifiable plus tard.
      </Text>

      <TextInput
        value={username}
        onChangeText={(text) => {
          setUsername(text.toLowerCase());
        }}
        placeholder="jean_moto"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />

      {error !== undefined ? (
        <Text variant="body" color={colors.danger} style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Button label={isSubmitting ? 'Enregistrement...' : 'Valider'} onPress={submit} disabled={!canSubmit} />
    </View>
  );
}
