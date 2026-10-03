// Définit la tâche de localisation d'arrière-plan dès le chargement de l'app.
import '../src/features/ride-summary/background-recording';

import type React from 'react';

import { RootLayout } from '../src/navigation/RootLayout';

export default function Root(): React.JSX.Element {
  return <RootLayout />;
}
