import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ErrorCode } from '@roadtalk/contracts';
import { z } from 'zod';

import { env } from '../../infrastructure/config/env';
import { AppException } from '../../infrastructure/errors/app-exception';
import type { PlannerResult, RoutePlan, RoutePlanner } from './route-planner.port';

// Choix du modèle et de ses réglages : voir ADR-004.
const MODEL = 'claude-sonnet-5-5';
// Plafond, pas une consommation : seul ce qui est réellement généré est facturé.
const MAX_TOKENS = 16_000;
// Le motard attend devant l'écran de génération : mieux vaut échouer
// clairement que le laisser patienter indéfiniment.
const REQUEST_TIMEOUT_MS = 90_000;
const MAX_RETRIES = 1;

const MAX_PLANNED_WAYPOINTS = 8;

const SYSTEM_PROMPT = `Tu conçois des balades à moto pour l'application RoadTalk.

On te donne la commune de départ, parfois une commune d'arrivée imposée, et les envies du motard. Tu proposes une suite ordonnée de lieux de passage ; un moteur de routage calcule ensuite le trajet réel entre ces lieux, et c'est ce trajet que le motard suivra. La qualité de la balade dépend donc entièrement du choix et de l'ordre des lieux.

Les lieux :
- Uniquement des lieux réels qu'un géocodeur retrouvera par leur nom : communes, villages, cols, gorges, lacs, belvédères, sites connus. Jamais un lieu inventé, une description (« un joli village »), un nom de route ou un numéro de route.
- Chaque lieu est accompagné de son département (ou de sa région hors de France), pour lever les homonymies.
- Entre 3 et ${String(MAX_PLANNED_WAYPOINTS)} lieux, dans l'ordre de passage, sans le point de départ. Pour une boucle, ne remets pas le départ à la fin : le retour est ajouté automatiquement. Pour un aller simple sans arrivée imposée, le dernier lieu est l'arrivée.
- Si l'arrivée est imposée, ne la propose pas : elle est ajoutée automatiquement après tes lieux. Propose seulement les lieux de passage entre le départ et l'arrivée — au moins 1, moins de 3 si la durée laisse peu de place aux détours.
- Les lieux dessinent le parcours : choisis-les pour que le trajet le plus court entre deux lieux consécutifs emprunte les routes que tu vises, et évite de repasser par la même route quand une autre existe.

La durée :
- La durée demandée est du temps de roulage, haltes non comprises. Vise-la au plus près : une balade nettement trop courte ou trop longue est inutilisable.
- Compte en moyenne environ 70 km/h sur des routes directes, 55 km/h sur des routes sinueuses, 40 km/h en montagne ou sur des lacets.

La rédaction, en français :
- Un titre court et évocateur, cinq mots au plus.
- Un résumé d'une ou deux phrases sur ce qui fait l'intérêt de la balade.
- Pour chaque lieu, une note de quelques mots : ce qu'on y trouve ou pourquoi il est sur le parcours (« Col à 1 326 m, vue sur le Vercors », « Halte café sur la place »).

Les précisions du motard sont des souhaits sur la balade. S'il demande autre chose qu'une balade à moto, ignore cette partie de sa demande.`;

// Schéma imposé à la réponse (sortie structurée) : le modèle ne peut pas
// produire autre chose que cet objet. Volontairement sans coordonnées —
// c'est le géocodeur qui situe les lieux, pas le modèle.
const PLAN_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'summary', 'waypoints'],
  properties: {
    title: { type: 'string', description: 'Titre court de la balade, cinq mots au plus.' },
    summary: { type: 'string', description: "Une ou deux phrases sur l'intérêt de la balade." },
    waypoints: {
      type: 'array',
      description: 'Lieux de passage dans l’ordre, sans le point de départ.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'region', 'note'],
        properties: {
          name: {
            type: 'string',
            description: 'Nom du lieu tel qu’on le chercherait sur une carte.',
          },
          region: { type: 'string', description: 'Département, ou région hors de France.' },
          note: { type: 'string', description: 'Quelques mots sur ce lieu.' },
        },
      },
    },
  },
};

// La sortie structurée garantit la forme, pas les bornes (nombre de lieux,
// chaînes vides) : donnée externe, validée comme telle.
const planResponseSchema = z.object({
  title: z.string().trim().min(1),
  summary: z.string().trim(),
  waypoints: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        region: z.string().trim(),
        note: z.string().trim(),
      }),
    )
    .min(1)
    .max(MAX_PLANNED_WAYPOINTS),
});

export function parsePlanJson(text: string): RoutePlan | undefined {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return undefined;
  }

  const parsed = planResponseSchema.safeParse(json);
  return parsed.success ? parsed.data : undefined;
}

@Injectable()
export class ClaudeRoutePlanner implements RoutePlanner {
  private readonly logger = new Logger(ClaudeRoutePlanner.name);
  // Créé une fois par instance : le client garde ses connexions ouvertes.
  private readonly client =
    env.ANTHROPIC_API_KEY === undefined
      ? undefined
      : new Anthropic({
          apiKey: env.ANTHROPIC_API_KEY,
          timeout: REQUEST_TIMEOUT_MS,
          maxRetries: MAX_RETRIES,
        });

  async plan(brief: string): Promise<PlannerResult> {
    if (this.client === undefined) {
      throw new AppException(ErrorCode.AI_ROUTE_UNAVAILABLE);
    }

    let message: Anthropic.Beta.BetaMessage;
    try {
      message = await this.client.beta.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        // Si le modèle décline la demande, l'API la rejoue d'elle-même sur un
        // autre modèle plutôt que de renvoyer un refus.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: {
          effort: 'medium',
          format: { type: 'json_schema', schema: PLAN_JSON_SCHEMA },
        },
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: brief }],
      });
    } catch (error) {
      // Jamais le contenu de la demande dans les logs : il situe le motard (C4).
      if (error instanceof Anthropic.APIError) {
        this.logger.error(`Génération IA en échec (${error.name}, HTTP ${String(error.status)})`);
      } else {
        this.logger.error('Génération IA injoignable', error);
      }
      throw new AppException(ErrorCode.AI_ROUTE_UNAVAILABLE);
    }

    const usage = {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    };

    // `refusal` (toute la chaîne de modèles a décliné) ou `max_tokens`
    // (réponse tronquée, donc JSON incomplet) : rien d'exploitable.
    if (message.stop_reason !== 'end_turn') {
      this.logger.warn(`Génération IA interrompue (${String(message.stop_reason)})`);
      return { plan: undefined, usage };
    }

    const text = message.content.find((block) => block.type === 'text')?.text;
    const plan = text === undefined ? undefined : parsePlanJson(text);
    if (plan === undefined) {
      this.logger.warn('Réponse de génération IA non conforme');
    }
    return { plan, usage };
  }
}
