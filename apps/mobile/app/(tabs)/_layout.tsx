import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import type React from 'react';
import { View } from 'react-native';

import { useAuthStore } from '../../src/features/auth/auth.store';
import { AppHeader } from '../../src/features/map/AppHeader';
import { useAppHeaderStore } from '../../src/features/map/appHeader.store';
import { colors, TAB_BAR_STYLE } from '../../src/ui';

const TAB_ICON_SIZE = 26;

export default function TabsLayout(): React.JSX.Element {
  const status = useAuthStore((state) => state.status);
  const username = useAuthStore((state) => state.username);
  const isHeaderVisible = useAppHeaderStore((state) => state.isVisible);
  const gpsStatus = useAppHeaderStore((state) => state.gpsStatus);

  // La racine (_layout.tsx) ne rend ce Stack qu'une fois status !== 'checking'
  // — ici il ne reste que le cas "pas connecté" à écarter.
  if (status !== 'authenticated') {
    return <Redirect href="/login" />;
  }

  if (typeof username !== 'string') {
    return <Redirect href="/username" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: TAB_BAR_STYLE,
          tabBarLabelStyle: {
            fontSize: 12,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Itinéraire',
            tabBarIcon: ({ color }) => <Ionicons name="navigate" color={color} size={TAB_ICON_SIZE} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Balades',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="motorbike" color={color} size={TAB_ICON_SIZE} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Cockpit',
            tabBarIcon: ({ color }) => <Ionicons name="options" color={color} size={TAB_ICON_SIZE} />,
          }}
        />
      </Tabs>
      {/* Un seul AppHeader pour les trois onglets (demande explicite : toujours
          visible), masqué seulement pendant le guidage actif sur l'onglet
          Itinéraire (voir MapScreen -> appHeader.store). */}
      {isHeaderVisible ? <AppHeader gpsStatus={gpsStatus} /> : null}
    </View>
  );
}
