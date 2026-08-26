import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type React from 'react';
import { Fragment, useEffect } from 'react';
import { View } from 'react-native';

import { useAuthStore } from '../features/auth/auth.store';
import { colors } from '../ui';
import { styles } from './RootLayout.styles';

export function RootLayout(): React.JSX.Element {
  const status = useAuthStore((state) => state.status);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate().catch(() => undefined);
  }, [hydrate]);

  return (
    <Fragment>
      <StatusBar style="light" />
      {status === 'checking' ? (
        <View style={styles.checking} />
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      )}
    </Fragment>
  );
}
