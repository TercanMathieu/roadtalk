import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type React from 'react';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from '../features/auth/auth.store';
import { colors } from '../ui';
import { styles } from './RootLayout.styles';

// SafeAreaProvider déclaré explicitement : les écrans posés en surimpression
// de la carte plein écran (barre de recherche) ont besoin des encoches pour
// ne pas passer sous la barre de statut, et rien ne garantit qu'un provider
// soit fourni par la navigation.
export function RootLayout(): React.JSX.Element {
  const status = useAuthStore((state) => state.status);
  const hydrate = useAuthStore((state) => state.hydrate);
  // Registre "cockpit" (écran Réglages, typography.mono/monoBold) — ces deux
  // graisses suffisent, tout le reste de l'app reste sur la police système.
  const [fontsLoaded] = useFonts({ JetBrainsMono_500Medium, JetBrainsMono_700Bold });

  useEffect(() => {
    hydrate().catch(() => undefined);
  }, [hydrate]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {status === 'checking' || !fontsLoaded ? (
        <View style={styles.checking} />
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      )}
    </SafeAreaProvider>
  );
}
