import { Redirect, useRouter } from 'expo-router';
import type React from 'react';

import { useAuthStore } from '../src/features/auth/auth.store';
import { ProfileCardScreen } from '../src/features/profile/ProfileCardScreen';

// La fiche ouverte depuis l'app pour la consulter ou la modifier — la même
// que celle de la première connexion (app/username.tsx), avec un bouton pour
// la refermer.
export default function ProfileRoute(): React.JSX.Element {
  const status = useAuthStore((state) => state.status);
  const router = useRouter();

  if (status !== 'authenticated') {
    return <Redirect href="/login" />;
  }

  return (
    <ProfileCardScreen
      onClose={() => {
        router.back();
      }}
    />
  );
}
