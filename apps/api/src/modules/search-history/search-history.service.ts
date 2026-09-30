import { Injectable } from '@nestjs/common';
import type { AddressHistoryDto, RecordAddressSelectionDto } from '@roadtalk/contracts';
import type { UserId } from '@roadtalk/domain-shared';

import { PrismaService } from '../../infrastructure/database/prisma.service';

// Assez pour retrouver une adresse récente d'un coup d'œil, trop peu pour
// noyer l'écran de préparation d'informations secondaires (C2).
const MAX_ENTRIES = 5;

@Injectable()
export class SearchHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: UserId): Promise<AddressHistoryDto> {
    const rows = await this.prisma.addressHistoryEntry.findMany({
      where: { userId },
      orderBy: { selectedAt: 'desc' },
      take: MAX_ENTRIES,
    });

    return {
      entries: rows.map((row) => ({
        label: row.label,
        context: row.context,
        latitude: row.latitude,
        longitude: row.longitude,
        selectedAt: row.selectedAt.getTime(),
      })),
    };
  }

  // Idempotent par construction : la contrainte unique (userId, label,
  // latitude, longitude) fait de chaque sélection un upsert — rechoisir la
  // même adresse ne duplique jamais la ligne, seulement `selectedAt` avance.
  async recordSelection(userId: UserId, selection: RecordAddressSelectionDto): Promise<void> {
    await this.prisma.addressHistoryEntry.upsert({
      where: {
        userId_label_latitude_longitude: {
          userId,
          label: selection.label,
          latitude: selection.latitude,
          longitude: selection.longitude,
        },
      },
      create: {
        userId,
        label: selection.label,
        context: selection.context,
        latitude: selection.latitude,
        longitude: selection.longitude,
      },
      update: {
        selectedAt: new Date(),
      },
    });
  }
}
