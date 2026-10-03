import { Inject, Injectable } from '@nestjs/common';
import { createRideId, ok, type Result, type RideId, type TimestampMs, type UserId } from '@roadtalk/domain-shared';

import { completeRide, planRide, type RideTransitionError, startRide } from '../domain/ride.entity';
import { summarizeTrack } from '../domain/summarize-track';
import type { TrackPoint } from '../domain/track-point';
import { RIDE_REPOSITORY, type RideListEntry, type RideRecord, type RideRepository } from './ride-repository.port';

export interface SaveCompletedRideInput {
  // Fourni par le client pour rendre l'envoi rejouable ; sinon tiré ici.
  readonly id?: RideId;
  readonly ownerId: UserId;
  readonly name: string;
  readonly startedAt: TimestampMs;
  readonly endedAt: TimestampMs;
  readonly track: readonly TrackPoint[];
}

// Orchestre le domaine (ADR-001) plutôt que de construire un CompletedRide à
// la main : la balade passe réellement par planRide -> startRide ->
// completeRide, avec les mêmes garde-fous (fin avant départ, etc.) qu'un
// futur flow planifié/actif utiliserait. En pratique startedAt/endedAt
// viennent du même enregistrement côté client donc RideTransitionError ne
// devrait jamais survenir ici, mais ce n'est pas au service de le supposer.
@Injectable()
export class RidesService {
  constructor(@Inject(RIDE_REPOSITORY) private readonly rides: RideRepository) {}

  async saveCompleted(input: SaveCompletedRideInput): Promise<Result<RideRecord, RideTransitionError>> {
    // Même balade déjà enregistrée par un envoi précédent dont le client n'a
    // pas reçu la réponse : on renvoie l'existante plutôt que d'échouer ou
    // d'en créer une seconde.
    if (input.id !== undefined) {
      const existing = await this.rides.findByIdForOwner(input.id, input.ownerId);
      if (existing !== undefined) {
        return ok(existing);
      }
    }

    const planned = planRide({ id: input.id ?? createRideId(), ownerId: input.ownerId });
    const started = startRide(planned, input.startedAt);
    if (!started.ok) {
      return started;
    }

    // Jamais le résumé envoyé par le client : recalculé ici à partir du
    // tracé brut, seule donnée qu'on choisit de faire confiance.
    const summary = summarizeTrack(input.track);
    const completed = completeRide(started.value, summary, input.endedAt);
    if (!completed.ok) {
      return completed;
    }

    const record: RideRecord = { ride: completed.value, name: input.name, isFavorite: false, track: input.track };
    await this.rides.save(record);
    return ok(record);
  }

  async listForOwner(ownerId: UserId): Promise<readonly RideListEntry[]> {
    return this.rides.findAllByOwner(ownerId);
  }

  async getForOwner(id: RideId, ownerId: UserId): Promise<RideRecord | undefined> {
    return this.rides.findByIdForOwner(id, ownerId);
  }

  async deleteForOwner(id: RideId, ownerId: UserId): Promise<boolean> {
    return this.rides.deleteByIdForOwner(id, ownerId);
  }

  async setFavoriteForOwner(id: RideId, ownerId: UserId, isFavorite: boolean): Promise<boolean> {
    return this.rides.setFavoriteByIdForOwner(id, ownerId, isFavorite);
  }

  async renameForOwner(id: RideId, ownerId: UserId, name: string): Promise<boolean> {
    return this.rides.renameByIdForOwner(id, ownerId, name);
  }
}
