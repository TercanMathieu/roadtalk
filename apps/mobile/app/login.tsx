import { Redirect } from 'expo-router';
import type React from 'react';

import { useAuthStore } from '../src/features/auth/auth.store';
import { AuthScreen } from '../src/features/auth/AuthScreen';

export default function LoginRoute(): React.JSX.Element {
  const status = useAuthStore((state) => state.status);

  if (status === 'authenticated') {
    return <Redirect href="/" />;
  }

  return <AuthScreen />;
}
