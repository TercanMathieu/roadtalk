import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useState } from 'react';

import { useAuthStore } from './auth.store';

// webClientId (pas androidClientId) : c'est l'audience attendue dans l'ID
// token renvoyé, quelle que soit la plateforme. Le client Android n'est
// utilisé qu'en interne par Play Services pour authentifier l'app via son
// certificat de signature — jamais référencé directement dans le code.
const GOOGLE_WEB_CLIENT_ID = String(process.env['EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'] ?? '');

console.log('GOOGLE_WEB_CLIENT_ID chargé :', JSON.stringify(GOOGLE_WEB_CLIENT_ID));

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  scopes: ['email', 'profile'],
});

interface GoogleSignIn {
  readonly isSigningIn: boolean;
  readonly error: string | undefined;
  readonly signIn: () => void;
}

export function useGoogleSignIn(): GoogleSignIn {
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const performSignIn = async (): Promise<void> => {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();

    if (response.type !== 'success') {
      // L'utilisateur a fermé le sélecteur de compte — pas une erreur.
      return;
    }

    if (response.data.idToken === null) {
      setError('Réponse Google incomplète.');
      return;
    }
    console.log(response.data.idToken)
    await signInWithGoogle(response.data.idToken);
  };

  return {
    isSigningIn,
    error,
    signIn: () => {
      setError(undefined);
      setIsSigningIn(true);
      performSignIn()
        .catch((caught: unknown) => {
          console.error('Google sign-in a échoué :', caught);
          setError('Connexion impossible, réessaie.');
        })
        .finally(() => {
          setIsSigningIn(false);
        });
    },
  };
}
