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
    return this.searchService.searchAddresses(query.q);
  }
}
