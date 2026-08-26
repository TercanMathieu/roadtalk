import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import type React from 'react';

import { useAuthStore } from '../../src/features/auth/auth.store';
import { colors } from '../../src/ui';

// Barre d'onglets pensée pour l'usage avec gants (C2) : hauteur augmentée par
// rapport au défaut RN, qui tourne autour de 50-55dp — trop juste pour une
// cible tactile fiable.
const TAB_BAR_HEIGHT = 72;
const TAB_ICON_SIZE = 26;

export default function TabsLayout(): React.JSX.Element {
  const status = useAuthStore((state) => state.status);
  const username = useAuthStore((state) => state.username);

  // La racine (_layout.tsx) ne rend ce Stack qu'une fois status !== 'checking'
  // — ici il ne reste que le cas "pas connecté" à écarter.
  if (status !== 'authenticated') {
    return <Redirect href="/login" />;
  }

  if (typeof username !== 'string') {
    return <Redirect href="/username" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: TAB_BAR_HEIGHT,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Carte',
          tabBarIcon: ({ color }) => <Ionicons name="map" color={color} size={TAB_ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color }) => <Ionicons name="time" color={color} size={TAB_ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Réglages',
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings" color={color} size={TAB_ICON_SIZE} />
          ),
        }}
      />
    </Tabs>
  );
}
