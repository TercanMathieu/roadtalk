import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ErrorCode,
  type RenameRideRequestDto,
  renameRideRequestSchema,
  type RideDetailDto,
  rideDetailSchema,
  type RideListItemDto,
  rideListSchema,
  type SaveRideRequestDto,
  saveRideRequestSchema,
  type SetRideFavoriteRequestDto,
  setRideFavoriteRequestSchema,
} from '@roadtalk/contracts';
import { degrees, meters, metersPerSecond, timestampMs, toRideId, type UserId } from '@roadtalk/domain-shared';

import { CurrentUserId } from '../../../infrastructure/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { AppException } from '../../../infrastructure/errors/app-exception';
import { ZodResponseInterceptor } from '../../../infrastructure/http/zod-response.interceptor';
import { ZodValidationPipe } from '../../../infrastructure/http/zod-validation.pipe';
import type { RideListEntry, RideRecord } from '../application/ride-repository.port';
import { RidesService } from '../application/rides.service';
import type { TrackPoint } from '../domain/track-point';

function toDomainTrackPoint(point: SaveRideRequestDto['track'][number]): TrackPoint {
  return {
    position: { latitude: degrees(point.latitude), longitude: degrees(point.longitude) },
    recordedAt: timestampMs(point.recordedAt),
    accuracyMeters: meters(point.accuracyMeters),
    speedMps: point.speedMps !== undefined ? metersPerSecond(point.speedMps) : undefined,
    altitudeMeters: point.altitudeMeters !== undefined ? meters(point.altitudeMeters) : undefined,
  };
}

function toListItemDto(entry: RideListEntry): RideListItemDto {
  return {
    id: entry.ride.id,
    name: entry.name,
    startedAt: entry.ride.startedAt,
    endedAt: entry.ride.endedAt,
    summary: entry.ride.summary,
    isFavorite: entry.isFavorite,
  };
}

function toDetailDto(record: RideRecord): RideDetailDto {
  return {
    ...toListItemDto({ ride: record.ride, name: record.name, isFavorite: record.isFavorite }),
    track: record.track.map((point) => ({
      latitude: point.position.latitude,
      longitude: point.position.longitude,
      recordedAt: point.recordedAt,
      accuracyMeters: point.accuracyMeters,
      ...(point.speedMps !== undefined ? { speedMps: point.speedMps } : {}),
      ...(point.altitudeMeters !== undefined ? { altitudeMeters: point.altitudeMeters } : {}),
    })),
  };
}

// Toutes les routes portent sur "les balades de l'appelant", même logique
// que UsersController : un token vérifié identifie l'utilisateur, pas de
// :userId dans l'URL.
@Controller('rides')
@UseGuards(JwtAuthGuard)
export class RidesController {
  constructor(private readonly rides: RidesService) {}

  @Post()
  @UseInterceptors(new ZodResponseInterceptor(rideDetailSchema))
  async save(
    @CurrentUserId() ownerId: UserId,
    @Body(new ZodValidationPipe(saveRideRequestSchema)) body: SaveRideRequestDto,
  ): Promise<RideDetailDto> {
    const result = await this.rides.saveCompleted({
      ownerId,
      name: body.name,
      startedAt: timestampMs(body.startedAt),
      endedAt: timestampMs(body.endedAt),
      track: body.track.map(toDomainTrackPoint),
    });

    if (!result.ok) {
      // N'arrive en pratique que si le client envoie endedAt < startedAt —
      // startRide/completeRide sont par ailleurs toujours appelés dans le
      // bon ordre par ce service (voir rides.service.ts).
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        result.error.type === 'end_before_start'
          ? 'La date de fin précède la date de départ'
          : 'Transition de balade invalide',
      );
    }

    return toDetailDto(result.value);
  }

  @Get()
  @UseInterceptors(new ZodResponseInterceptor(rideListSchema))
  async list(@CurrentUserId() ownerId: UserId): Promise<readonly RideListItemDto[]> {
    const entries = await this.rides.listForOwner(ownerId);
    return entries.map(toListItemDto);
  }

  @Get(':id')
  @UseInterceptors(new ZodResponseInterceptor(rideDetailSchema))
  async getById(
    @CurrentUserId() ownerId: UserId,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RideDetailDto> {
    const record = await this.rides.getForOwner(toRideId(id), ownerId);
    if (record === undefined) {
      throw new NotFoundException();
    }
    return toDetailDto(record);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteById(@CurrentUserId() ownerId: UserId, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const deleted = await this.rides.deleteForOwner(toRideId(id), ownerId);
    if (!deleted) {
      throw new AppException(ErrorCode.RIDE_NOT_FOUND, 'Balade introuvable');
    }
  }

  @Patch(':id/favorite')
  @HttpCode(204)
  async setFavorite(
    @CurrentUserId() ownerId: UserId,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(setRideFavoriteRequestSchema)) body: SetRideFavoriteRequestDto,
  ): Promise<void> {
    const updated = await this.rides.setFavoriteForOwner(toRideId(id), ownerId, body.isFavorite);
    if (!updated) {
      throw new AppException(ErrorCode.RIDE_NOT_FOUND, 'Balade introuvable');
    }
  }

  @Patch(':id/name')
  @HttpCode(204)
  async rename(
    @CurrentUserId() ownerId: UserId,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(renameRideRequestSchema)) body: RenameRideRequestDto,
  ): Promise<void> {
    const updated = await this.rides.renameForOwner(toRideId(id), ownerId, body.name);
    if (!updated) {
      throw new AppException(ErrorCode.RIDE_NOT_FOUND, 'Balade introuvable');
    }
  }
}
