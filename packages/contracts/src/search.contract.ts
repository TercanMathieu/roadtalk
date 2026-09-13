import { z } from 'zod';

// Minimum 3 caractères : évite d'interroger le géocodeur sur une frappe
// d'une ou deux lettres, qui ne renvoie rien d'exploitable de toute façon.
export const addressSearchQuerySchema = z.object({
  q: z.string().min(3).max(200),
});

export type AddressSearchQueryDto = z.infer<typeof addressSearchQuerySchema>;

export const addressSuggestionSchema = z.object({
  // Ligne principale affichée dans la liste de résultats.
  label: z.string().min(1),
  // Ligne secondaire (code postal, ville, pays) — null quand le géocodeur ne
  // renvoie aucun élément de contexte exploitable.
  context: z.string().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type AddressSuggestionDto = z.infer<typeof addressSuggestionSchema>;

// Enveloppé dans un objet plutôt qu'un tableau nu : laisse la place à des
// métadonnées (pagination, provider utilisé) sans casser le contrat.
export const addressSearchResultsSchema = z.object({
  results: z.array(addressSuggestionSchema),
});

export type AddressSearchResultsDto = z.infer<typeof addressSearchResultsSchema>;
