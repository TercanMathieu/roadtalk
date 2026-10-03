import { Inject, Injectable } from '@nestjs/common';
import {
  type AiRouteDto,
  type AiRouteEnding,
  type AiRouteWaypointDto,
  ErrorCode,
  type GenerateAiRouteRequestDto,
  type RouteGeometryDto,
} from '@roadtalk/contracts';
import type { UserId } from '@roadtalk/domain-shared';

import { env } from '../../infrastructure/config/env';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AppException } from '../../infrastructure/errors/app-exception';
import { ValhallaRouter } from '../routing/valhalla.router';
import { PhotonGeocoder } from '../search/photon.geocoder';
import {
  distanceMeters,
  durationGap,
  durationVerdict,
  knownEnd,
  maxTravelMeters,
  minimumWaypoints,
  pickWaypointCandidate,
  searchBiasPoint,
} from './plan-feasibility';
import { buildRetryFeedback, buildRouteBrief, type RetryReason } from './route-brief';
import {
  type PlannerUsage,
  ROUTE_PLANNER,
  type RoutePlan,
  type RoutePlanner,
} from './route-planner.port';

// Seules les méthodes utilisées : permet de les remplacer en test sans
// toucher au géocodeur ni au moteur de routage réels.
export type PlaceFinder = Pick<PhotonGeocoder, 'reverseLocality' | 'searchAddresses'>;
export type RouteCalculator = Pick<ValhallaRouter, 'computeRoute'>;

// Une proposition, plus une seconde si la première est inexploitable ou mal
// calibrée en durée. Au-delà, le coût et l'attente montent pour un gain
// incertain.
const MAX_ATTEMPTS = 2;
// Quelques résultats par lieu : le premier est parfois un homonyme lointain.
const GEOCODER_CANDIDATES = 3;
const QUOTA_WINDOW_MS = 24 * 60 * 60 * 1000;

function routeEnding(request: GenerateAiRouteRequestDto): AiRouteEnding {
  if (request.tripType === 'loop') {
    return 'start';
  }
  return request.destination !== undefined ? 'destination' : 'last-waypoint';
}

interface Candidate {
  readonly plan: RoutePlan;
  readonly waypoints: readonly AiRouteWaypointDto[];
  readonly geometry: RouteGeometryDto;
}

@Injectable()
export class AiRoutesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ROUTE_PLANNER) private readonly planner: RoutePlanner,
    @Inject(PhotonGeocoder) private readonly places: PlaceFinder,
    @Inject(ValhallaRouter) private readonly router: RouteCalculator,
  ) {}

  async generate(userId: UserId, request: GenerateAiRouteRequestDto): Promise<AiRouteDto> {
    // Hors d'atteinte même en ligne droite : inutile de payer une génération
    // vouée à l'échec.
    if (
      request.destination !== undefined &&
      distanceMeters(request.origin, request.destination) > maxTravelMeters(request.durationMinutes)
    ) {
      throw new AppException(ErrorCode.AI_ROUTE_DESTINATION_TOO_FAR);
    }

    // Deux demandes simultanées peuvent passer toutes les deux sous la limite :
    // dépassement d'une génération au plus, accepté plutôt qu'un verrou.
    const usedToday = await this.countRecentGenerations(userId);
    if (usedToday >= env.AI_ROUTE_DAILY_LIMIT) {
      throw new AppException(ErrorCode.AI_ROUTE_QUOTA_EXCEEDED);
    }

    const startLocality = await this.places.reverseLocality(request.origin);
    if (startLocality === undefined) {
      throw new AppException(
        ErrorCode.AI_ROUTE_GENERATION_FAILED,
        'Impossible de situer le point de départ',
      );
    }
    let destinationLocality: string | undefined;
    if (request.destination !== undefined) {
      destinationLocality = await this.places.reverseLocality(request.destination);
      if (destinationLocality === undefined) {
        throw new AppException(
          ErrorCode.AI_ROUTE_GENERATION_FAILED,
          "Impossible de situer l'arrivée",
        );
      }
    }
    const localities = { start: startLocality, destination: destinationLocality };

    let usage: PlannerUsage = { inputTokens: 0, outputTokens: 0 };
    let succeeded = false;
    try {
      let best: Candidate | undefined;
      let retryReason: RetryReason | undefined;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const feedback =
          retryReason === undefined ? undefined : buildRetryFeedback(retryReason, request);
        const result = await this.planner.plan(buildRouteBrief(request, localities, feedback));
        usage = {
          inputTokens: usage.inputTokens + result.usage.inputTokens,
          outputTokens: usage.outputTokens + result.usage.outputTokens,
        };

        if (result.plan === undefined) {
          retryReason = { kind: 'unusable' };
          continue;
        }

        const outcome = await this.buildCandidate(result.plan, request);
        if (!('geometry' in outcome)) {
          retryReason = outcome;
          continue;
        }

        const { durationSeconds } = outcome.geometry;
        if (
          best === undefined ||
          durationGap(durationSeconds, request.durationMinutes) <
            durationGap(best.geometry.durationSeconds, request.durationMinutes)
        ) {
          best = outcome;
        }

        const verdict = durationVerdict(durationSeconds, request.durationMinutes);
        if (verdict === 'ok') {
          break;
        }
        retryReason = {
          kind: verdict,
          placeNames: result.plan.waypoints.map((waypoint) => waypoint.name),
          actualSeconds: durationSeconds,
        };
      }

      // Hors de la cible malgré la seconde tentative : la plus proche est tout
      // de même servie — sa durée affichée est la vraie, le motard juge.
      if (best === undefined) {
        throw new AppException(ErrorCode.AI_ROUTE_GENERATION_FAILED);
      }

      succeeded = true;
      return {
        title: best.plan.title,
        summary: best.plan.summary,
        waypoints: [...best.waypoints],
        ending: routeEnding(request),
        avoidHighways: request.roadPreferences.includes('avoidHighways'),
        geometry: best.geometry,
        remainingToday: Math.max(0, env.AI_ROUTE_DAILY_LIMIT - usedToday - 1),
      };
    } finally {
      // Toute demande facturée compte dans le quota, aboutie ou non : un échec
      // coûte autant qu'un succès (C5).
      if (usage.inputTokens > 0 || usage.outputTokens > 0) {
        await this.prisma.aiRouteGeneration.create({
          data: {
            userId,
            succeeded,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
          },
        });
      }
    }
  }

  private async countRecentGenerations(userId: UserId): Promise<number> {
    return this.prisma.aiRouteGeneration.count({
      where: { userId, createdAt: { gte: new Date(Date.now() - QUOTA_WINDOW_MS) } },
    });
  }

  // Retrouve chaque lieu proposé sur la carte puis calcule le trajet réel.
  // Une raison de réessayer plutôt qu'une exception quand c'est la
  // proposition qui est en cause, pas un service en panne.
  private async buildCandidate(
    plan: RoutePlan,
    request: GenerateAiRouteRequestDto,
  ): Promise<Candidate | RetryReason> {
    const end = knownEnd(request);
    const travelMeters = maxTravelMeters(request.durationMinutes);
    const bias = searchBiasPoint(request.origin, end);
    const waypoints: AiRouteWaypointDto[] = [];

    // Un à un plutôt qu'en parallèle : l'instance communautaire de Photon
    // limite le débit, et chaque point retenu sert à écarter les doublons du
    // suivant.
    for (const planned of plan.waypoints) {
      const candidates = await this.places.searchAddresses(
        `${planned.name}, ${planned.region}`,
        GEOCODER_CANDIDATES,
        bias,
      );
      const found = pickWaypointCandidate(candidates, request.origin, end, travelMeters, waypoints);
      if (found !== undefined) {
        waypoints.push({ ...found, note: planned.note });
      }
    }

    if (waypoints.length < minimumWaypoints(request.tripType)) {
      return { kind: 'not-found' };
    }

    const stops = waypoints.map(({ latitude, longitude }) => ({ latitude, longitude }));
    try {
      const geometry = await this.router.computeRoute(
        [request.origin, ...stops, ...(end !== undefined ? [end] : [])],
        request.roadPreferences.includes('avoidHighways'),
      );
      return { plan, waypoints, geometry };
    } catch (error) {
      if (error instanceof AppException && error.code === ErrorCode.ROUTE_NOT_FOUND) {
        return { kind: 'unreachable', placeNames: plan.waypoints.map((waypoint) => waypoint.name) };
      }
      throw error;
    }
  }
}
