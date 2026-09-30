import { z } from 'zod';

// Même forme que addressSuggestionSchema (search.contract.ts), mais un
// contrat distinct : coïncidence de structure aujourd'hui, pas une garantie
// que les deux évoluent ensemble — l'historique pourrait par exemple gagner
// un compteur de fréquence sans toucher aux résultats de recherche.
export const addressHistoryEntrySchema = z.object({
  label: z.string().min(1),
  context: z.string().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  // Instant de la dernière sélection, pas de la création — voir le
  // commentaire du modèle Prisma.
  selectedAt: z.number().int().nonnegative(),
});

export type AddressHistoryEntryDto = z.infer<typeof addressHistoryEntrySchema>;

export const addressHistorySchema = z.object({
  entries: z.array(addressHistoryEntrySchema),
});

export type AddressHistoryDto = z.infer<typeof addressHistorySchema>;

// Ce qu'enregistre une sélection : mêmes champs qu'une suggestion, sans
// selectedAt — c'est le serveur qui l'horodate, jamais le client.
export const recordAddressSelectionSchema = z.object({
  label: z.string().min(1),
  context: z.string().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type RecordAddressSelectionDto = z.infer<typeof recordAddressSelectionSchema>;
