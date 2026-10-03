import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useFriendsStore } from './friends.store';

// Nombre de demandes d'amis reçues, pour la pastille de l'en-tête. Rechargé
// à l'affichage et à chaque retour de l'app au premier plan : sans
// notifications push (hors périmètre V1), c'est ainsi qu'une demande se voit
// arriver. Une seule requête légère à ces moments-là, aucune interrogation
// en boucle (C1).
export function useIncomingFriendRequestCount(): number {
  const count = useFriendsStore((state) => state.overview?.incoming.length ?? 0);
  const refresh = useFriendsStore((state) => state.refresh);

  useEffect(() => {
    const load = (): void => {
      refresh().catch(() => undefined);
    };
    load();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        load();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [refresh]);

  return count;
}
