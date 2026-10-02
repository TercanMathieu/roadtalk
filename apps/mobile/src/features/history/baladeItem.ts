import type { RideListItemDto, RouteDto } from '@roadtalk/contracts';
import { Alert } from 'react-native';

// Partagé entre HistoryScreen (liste) et BaladeDetailModal (détail) — voir
// HistoryScreen pour le raisonnement complet sur "Favoris" = routes
// enregistrées.
export type BaladeItem =
  | { readonly kind: 'ride'; readonly ride: RideListItemDto }
  | { readonly kind: 'route'; readonly route: RouteDto };

export function itemDate(item: BaladeItem): number {
  return item.kind === 'ride' ? item.ride.startedAt : item.route.createdAt;
}

export function itemId(item: BaladeItem): string {
  return item.kind === 'ride' ? item.ride.id : item.route.id;
}

export function confirmDeleteBaladeItem(item: BaladeItem, name: string, onConfirm: () => void): void {
  const what = item.kind === 'ride' ? 'cette balade' : 'cet itinéraire';
  Alert.alert(`Supprimer ${what} ?`, `« ${name} » sera définitivement supprimée.`, [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Supprimer', style: 'destructive', onPress: onConfirm },
  ]);
}
