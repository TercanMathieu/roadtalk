import { Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

// Partagé entre modules/users et modules/auth : sans ce module, chacun
// déclarerait son propre PrismaService dans ses providers, donc deux pools
// de connexions distincts au lieu d'un seul.
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
