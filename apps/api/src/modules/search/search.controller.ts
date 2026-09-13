import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  type AddressSearchQueryDto,
  addressSearchQuerySchema,
  type AddressSearchResultsDto,
  addressSearchResultsSchema,
} from '@roadtalk/contracts';

import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ZodResponseInterceptor } from '../../infrastructure/http/zod-response.interceptor';
import { ZodValidationPipe } from '../../infrastructure/http/zod-validation.pipe';
import { SearchService } from './search.service';

// Route protégée : sans garde, n'importe qui pourrait se servir de l'API comme
// relais gratuit vers le géocodeur, et saturer une instance communautaire.
@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('addresses')
  @UseInterceptors(new ZodResponseInterceptor(addressSearchResultsSchema))
  async searchAddresses(
    @Query(new ZodValidationPipe(addressSearchQuerySchema)) query: AddressSearchQueryDto,
  ): Promise<AddressSearchResultsDto> {
    // Reconstruction plutôt que passage direct : le contrat garantit que les
    // deux coordonnées vont ensemble, mais seul un objet complet ou absent est
    // acceptable pour `SearchOrigin` (exactOptionalPropertyTypes).
    const origin =
      query.latitude !== undefined && query.longitude !== undefined
        ? { latitude: query.latitude, longitude: query.longitude }
        : undefined;

    return this.searchService.searchAddresses(query.q, origin);
  }
}
