import { z } from 'zod';

// Minimum 3 caractères : évite d'interroger le géocodeur sur une frappe
// d'une ou deux lettres, qui ne renvoie rien d'exploitable de toute façon.
// `latitude`/`longitude` sont la position de l'utilisateur : elles ne servent
// qu'à orienter le classement des résultats vers ce qui est proche de lui.
// Optionnelles — la recherche doit rester possible sans position connue
// (permission refusée, premier point GPS pas encore acquis).
export const addressSearchQuerySchema = z
  .object({
    q: z.string().min(3).max(200),
    // `coerce` : une query string n'apporte que du texte.
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
  })
  .refine((query) => (query.latitude === undefined) === (query.longitude === undefined), {
    message: 'latitude et longitude doivent être fournies ensemble',
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
