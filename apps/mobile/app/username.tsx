import { Redirect } from 'expo-router';
import type React from 'react';

import { useAuthStore } from '../src/features/auth/auth.store';
import { ProfileCardScreen } from '../src/features/profile/ProfileCardScreen';

export default function UsernameRoute(): React.JSX.Element {
  const status = useAuthStore((state) => state.status);
  const username = useAuthStore((state) => state.username);

  if (status !== 'authenticated') {
    return <Redirect href="/login" />;
  }

  if (typeof username === 'string') {
    return <Redirect href="/" />;
  }

  return <ProfileCardScreen />;
}
